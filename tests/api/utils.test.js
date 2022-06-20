import axios from "axios";
import { data as citoids } from "../../mocks/citoid";
import { findCollections } from "../../mocks/zotero/collections";
import { data as apiKeys } from "../../mocks/zotero/keys";
import { data as bibs, findBibliographyEntry } from "../../mocks/zotero/bib";
import { data as libraries } from "../../mocks/zotero/libraries";
import { data as semantics } from "../../mocks/semantic-scholar";
import { data as tags, findTags } from "../../mocks/zotero/tags";
import { cleanBibliographyHTML, deleteTags, extractCitekeys, fetchBibliography, fetchCitoid, fetchCollections, fetchPermissions, fetchSemantic, fetchTags, makeTagList, parseSemanticDOIs } from "../../src/api/utils";

const { keyWithFullAccess: { key: masterKey }} = apiKeys;
const { userLibrary, groupLibrary } = libraries;
const getLibraryPath = (library) => {
	return library.type + "s/" + library.id;
};

describe("Cleaning XHTML markup for bibliography entries", () => {
	// Necessary since jsdom does not support innerText
	// It shouldn't give discrepant results here
	// https://github.com/jsdom/jsdom/issues/1245#issuecomment-763535573
	beforeAll(() => {
		Object.defineProperty(HTMLElement.prototype, "innerText", {
			get() {
				return this.textContent;
			}
		});
	});

	it("should correctly format XHTML into Roam markup", () => {
		expect(cleanBibliographyHTML(bibs.itemFromUserLibrary.bib))
			.toBe("Agarwal, Payal, Rick Wang, Christopher Meaney, Sakina Walji, Ali Damji, Navsheer Gill Toor, Gina Yip, et al. “Sociodemographic Differences in Patient Experience with Virtual Care during COVID-19.” medRxiv, July 22, 2021. https://www.medrxiv.org/content/10.1101/2021.07.19.21260373v1.");
	});
});

test("Extracting citekeys for Zotero items", () => {
	const cases = [
		{ key: "ABCD1234", data: { extra: "Citation Key: someCitekey1994" }},
		{ key: "PQRST789", data: { extra: "" }}
	];

	const expectations = [
		{ key: "someCitekey1994", data: { extra: "Citation Key: someCitekey1994" }, has_citekey: true },
		{ key: "PQRST789", data: { extra: "" }, has_citekey: false}
	];

	expect(extractCitekeys(cases)).toEqual(expectations);
});

describe("Creating formatted tag lists", () => {
	const cases = Object.entries(libraries);

	function setExpectations(path, list){
		const output = {};
		Object.entries(list).map(([initial, tokens]) => {
			output[initial] = tokens.map(token => ({
				token,
				roam: [],
				zotero: findTags(path, token).reverse().sort((a,b) => a.tag < b.tag ? 1 : -1)
			}));
		});
		return output;
	}

	const expectations = {
		[userLibrary.path]: setExpectations(userLibrary.path, {
			"i": ["immigrant youth", "immigration"],
			"p": ["patient journeys"]
		}),
		[groupLibrary.path]: setExpectations(groupLibrary.path, {
			"h": ["housing"],
			"u": ["urban design"]
		})
	};

	test.each(cases)(
		"%# Creating tag list for %s",
		(_libName, libraryDetails) => {
			const { path } = libraryDetails;
			expect(makeTagList(tags[path])).toEqual(expectations[path]);
		}
	);
});

test("Selecting and formatting Semantic DOIs", () => {
	const items = [
		{ doi: null },
		{ doi: "invalid.DOI"},
		{ doi: "10.1186/S40985-018-0094-7"},
		{ doi: "10.1370/afm.1918" }
	];

	expect(parseSemanticDOIs(items))
		.toEqual([
			{ doi: "10.1186/s40985-018-0094-7"},
			{ doi: "10.1370/afm.1918" }
		]);
});

describe("Fetching mocked API Key permissions", () => {
	const cases = Object.entries(apiKeys);
	test.each(cases)(
		"%# Fetching permissions for %s", 
		async(_keyName, expectation) => {
			const permissions = await fetchPermissions(expectation.key);
			expect(permissions).toEqual(expectation);
		}
	);
});

describe("Fetching mocked bibliography", () => {
	const cases = Object.entries(bibs);
	test.each(cases)(
		"%# Fetching bibliography as bib for %s",
		async(_bibName, entry) => {
			const path = getLibraryPath(entry.library);

			const bibliography = await fetchBibliography(entry.key, { apikey: masterKey, path }, { include: "bib" });
			const { bib } = findBibliographyEntry({ key: entry.key, path });

			expect(bibliography).toEqual(bib);
		}
	);
});

describe("Fetching mocked collections", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# There should be no items older than latest in %s",
		(_libName, libraryDetails) => {
			const { type, id, version } = libraryDetails;
			expect(findCollections(type, id, version)).toEqual([]);
		}
	);

	test.each(cases)(
		"%# Fetching collections for %s",
		async(_libName, libraryDetails) => {
			const { id, path, type, version } = libraryDetails;
			const libraryObj = {
				apikey: masterKey,
				path
			};

			const allCollections = await fetchCollections(
				libraryObj, 
				0, 
				{ match: [] }
			);
			expect(allCollections).toEqual({
				data: findCollections(type, id, 0),
				lastUpdated: version
			});

			const sinceLatest = await fetchCollections(
				libraryObj, 
				version, 
				{ match: allCollections.data }
			);
			expect(sinceLatest).toEqual({
				data: findCollections(type, id, 0),
				lastUpdated: version
			});
		}
	);
});

describe("Fetching mocked tags", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Fetching tags for %s",
		async(_libName, libraryDetails) => {
			const { path, version } = libraryDetails;
			const tagData = await fetchTags({ apikey: masterKey, path });
			expect(tagData).toEqual({
				data: makeTagList(tags[path]),
				lastUpdated: version
			});
		}
	);
});

describe("Deleting mocked tags", () => {
	const cases = Object.entries(libraries);

	test.each(cases)(
		"%# Deleting tags in %s",
		async(_libName, libraryDetails) => {
			const { path, version } = libraryDetails;
            
			const deleteExpired = await deleteTags(["systems"], { apikey: masterKey, path }, version - 10)
				.catch((error) => {
					if(error.response){
						return error.response;
					}
				});
			expect(deleteExpired.status).toBe(412);

			const deleteLatest = await deleteTags(["systems"], { apikey: masterKey, path }, version);
			expect(deleteLatest.status).toBe(204);
		}
	);
});

describe("Fetching mocked Citoid data", () => {
	const { success_cases, error_cases } = Object.entries(citoids).reduce((obj, entry) => {
		const { status = 200 } = entry[1];
		if(status == 200){
			obj.success_cases.push(entry);
		} else {
			obj.error_cases.push(entry);
		}
		return obj;
	}, { success_cases: [], error_cases: [] });

	test.each(success_cases)(
		"%# Successfully mocking Citoid data for %s",
		async(identifier, itemData) => {
			const { status, ...output } = itemData;
			const citoid = await fetchCitoid(identifier);
			expect(citoid).toEqual({
				item: output,
				query: identifier
			});
		}
	);

	test.each(error_cases)(
		"%# Successfully mocking Citoid error for %s",
		async(identifier, itemData) => {
			const { status, ...output } = itemData;
			const res = await fetchCitoid(identifier)
				.catch((error) => {
					if(error.response){
						return error.response;
					}
				});
			expect(res.status).toBe(status);
			expect(res.data).toEqual([output]);
		}
	);
    
});

describe("Fetching mocked Semantic data", () => {
	const cases = Object.entries(semantics);
	test.each(cases)(
		"%# Successfully mocking Semantic data for %s",
		async(doi, semanticData) => {
			const { citations, references } = semanticData;
			
			const res = await fetchSemantic(doi);

			expect(res).toEqual({
				doi,
				citations: parseSemanticDOIs(citations),
				references: parseSemanticDOIs(references)
			});
		}
	);
});

describe("Mock fallback", () => {
	it("is called when no matching handler exists", async() => {
		const res = await axios.get("https://example.com/")
			.catch((error) => {
				if(error.response){
					return error.response;
				}
			});
		expect(res.status).toBe(404);
		expect(res.statusText).toBe("You need to add a handler for https://example.com/");
	});
});