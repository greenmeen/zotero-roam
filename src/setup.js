import * as Sentry from "@sentry/react";
import { unmountComponentAtNode } from "react-dom";

import { registerSmartblockCommands } from "./smartblocks";
import { setDefaultHooks } from "./events";

import {
	EXTENSION_PORTAL_ID,
	EXTENSION_SLOT_ID,
	TYPEMAP_DEFAULT
} from "./constants";


/** Generates a data requests configuration object
 * @param {Array} reqs - Data requests provided by the user
 * @returns {ConfigRequests} A configuration object for the extension to use
 */
export function analyzeUserRequests(reqs){
	if(reqs.length == 0){
		console.warn("At least one data request must be specified for the extension to function. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
		return {
			dataRequests: [],
			apiKeys: [],
			libraries: []
		};
	} else {
		const fallbackAPIKey = reqs.find(req => req.apikey)?.apikey;
		if(!fallbackAPIKey){
			throw new Error("At least one data request must be assigned an API key. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/zotero-roam/getting-started/api");
		} else {
			const dataRequests = reqs.map((req) => {
				const { apikey, dataURI, library, name = "" } = req;
				if(library){
					const { id, type } = library;
                    
					if(!id || isNaN(id)){
						throw new Error("A library ID is missing or invalid. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
					}

					if(!type || !["users", "groups"].includes(type)){
						throw new Error("A library type is missing or invalid. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
					}

					return {
						apikey: apikey || fallbackAPIKey,
						dataURI: [type, id, "items"].join("/"),
						library: {
							id,
							path: [type, id].join("/"),
							type,
							uri: "items"
						},
						name
					};
				} else {

					if(!dataURI){
						throw new Error("Each data request must be assigned a data URI. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/api");
					}
                    
					const match = [...dataURI.matchAll(/(users|groups)\/(\d+?)\/(items.*)/g)];
					
					if(match.length == 0){
						throw new Error(`An incorrect data URI was provided for a request : ${dataURI}. See the documentation here : https://alix-lahuec.gitbook.io/zotero-roam/getting-started/prereqs#zotero-api-credentials`);
					} 
                    
					const [/*input*/, type, id, uri] = match[0];
					return { 
						apikey: apikey || fallbackAPIKey, 
						dataURI, 
						library: {
							id,
							path: [type, id].join("/"),
							type,
							uri
						}, 
						name 
					};
				}
			});

			const apiKeys = Array.from(new Set(dataRequests.map(req => req.apikey))).filter(Boolean);
			const libraries = dataRequests.reduce((arr, req) => {
				const { library: { path }, apikey } = req;
				const has_lib = arr.find(lib => lib.path == path);
				if(!has_lib){
					arr.push({ path, apikey });
				}
				return arr;
			}, []);

			return {
				dataRequests,
				apiKeys,
				libraries
			};
		}
	}
}

export function setupInitialSettings(settingsObject){
	const {
		annotations = {},
		autocomplete = {},
		copy = {},
		// dataRequests = [],
		metadata = {},
		notes = {},
		other = {},
		pageMenu = {},
		// requests = { dataRequests: [], apiKeys: [], libraries: []}
		sciteBadge = {},
		shortcuts = {},
		typemap = {},
		webimport = {}
	} = settingsObject;
	
	return {
		annotations: {
			func: "",
			group_by: false,
			template_comment: "{{comment}}",
			template_highlight: "[[>]] {{highlight}} ([p. {{page_label}}]({{link_page}})) {{tags_string}}",
			use: "default",
			__with: "formatted",
			...annotations
		},
		autocomplete: {
			display: "citekey",
			format: "citation",
			trigger: "",
			...autocomplete
		},
		copy: {
			always: false,
			overrideKey: "shiftKey",
			preset: "citekey",
			template: "@{{key}}",
			useAsDefault: "preset",
			useQuickCopy: false,
			...copy
		},
		metadata: {
			func: "",
			smartblock: {
				param: "srcUid",
				paramValue: ""
			},
			use: "default",
			...metadata
		},
		notes: {
			func: "",
			split_char: "",
			split_preset: "\n",
			split_use: "preset",
			use: "default",
			__with: "text",
			...notes
		},
		other: {
			autoload: false,
			darkTheme: false,
			render_inline: false,
			shareErrors: false,
			...other
		},
		pageMenu: {
			defaults: ["addMetadata", "importNotes", "viewItemInfo", "openZoteroLocal", "openZoteroWeb", "pdfLinks", "sciteBadge", "connectedPapers", "semanticScholar", "googleScholar", "citingPapers"],
			trigger: "default",
			...pageMenu
		},
		sciteBadge: {
			layout: "horizontal",
			showLabels: false,
			showZero: true,
			small: false,
			tooltipPlacement: "auto",
			tooltipSlide: 0,
			...sciteBadge
		},
		shortcuts: {
			"copyDefault": "",
			"copyCitation": "",
			"copyCitekey": "",
			"copyPageRef": "",
			"copyTag": "",
			"focusSearchBar": "",
			"goToItemPage": "",
			"importMetadata": "",
			"toggleDashboard": "",
			"toggleNotes": "alt+N",
			"toggleSearchPanel": "alt+E",
			"toggleSettingsPanel": "",
			"toggleQuickCopy": "",
			...shortcuts
		},
		typemap: {
			...TYPEMAP_DEFAULT,
			...typemap
		},
		webimport: {
			tags: [],
			...webimport
		}
	};
}

/* istanbul ignore next */
function configRoamDepot({ extensionAPI }){
	const current = extensionAPI.settings.getAll();
	const settings = setupInitialSettings(current || {});

	Object.entries(settings).forEach(([key, val]) => {
		extensionAPI.settings.set(key, val);
	});

	let requests = extensionAPI.settings.get("requests");
	if(!requests){
		requests = {
			dataRequests: [],
			apiKeys: [],
			libraries: []
		};
		extensionAPI.settings.set("requests", requests);
	}

	return {
		requests,
		settings
	};
}

/* istanbul ignore next */
function configRoamJS({ manualSettings }){
	const { dataRequests } = manualSettings;

	const settings = setupInitialSettings(manualSettings);

	const requests = analyzeUserRequests(dataRequests);

	return {
		requests,
		settings
	};
}

/* istanbul ignore next */
export function initialize(context = "roam/js", { extensionAPI, manualSettings }){
	const { requests, settings } = (context == "roam/depot")
		? configRoamDepot({ extensionAPI })
		: configRoamJS({ manualSettings });
    
	return { requests, settings };
}

/* istanbul ignore next */
/** Sets up the extension's theme (light vs dark)
 * @param {Boolean} use_dark - If the extension's theme should be `dark`
 */
function setupDarkTheme(use_dark = false){
	document.getElementsByTagName("body")[0].setAttribute("zr-dark-theme", (use_dark == true).toString());
}

/* istanbul ignore next */
/** Injects DOM elements to be used as React portals by the extension */
export function setupPortals(){

	unmountExtensionIfExists();

	const roamSearchbar = document.querySelector(".rm-topbar .rm-find-or-create-wrapper");
	const extensionSlot = document.createElement("span");
	extensionSlot.id = EXTENSION_SLOT_ID;
	roamSearchbar.insertAdjacentElement("afterend", extensionSlot);

	const zrPortal = document.createElement("div");
	zrPortal.id = EXTENSION_PORTAL_ID;
	document.getElementById("app").appendChild(zrPortal);
}

/* istanbul ignore next */
export function setupSentry(isUserEnabled = false, config = {}){
	// https://github.com/getsentry/sentry-javascript/issues/2039
	if(isUserEnabled){
		Sentry.getCurrentHub().getClient().getOptions().enabled = true;
		Sentry.setContext("config", config);
	} else {
		Sentry.getCurrentHub().getClient().getOptions().enabled = false;
	}
}

/* istanbul ignore next */
export function setup({ settings }){
	setupDarkTheme(settings.other.darkTheme);
	setDefaultHooks();
	registerSmartblockCommands();
}

/* istanbul ignore next */
export function unmountExtensionIfExists(){
	const existingSlot = document.getElementById(EXTENSION_SLOT_ID);
	if(existingSlot){
		try{
			unmountComponentAtNode(existingSlot);
			existingSlot.remove();
		} catch(e){
			console.error(e);
		}
	}

	// Portal for the extension's overlays
	try{ 
		document.getElementById(EXTENSION_PORTAL_ID).remove(); 
	} catch(e){
		// Do nothing
	}
}
