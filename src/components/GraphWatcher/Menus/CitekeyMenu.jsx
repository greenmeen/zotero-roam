import React, { useCallback, useContext, useMemo, useState } from "react";
import { arrayOf, bool, shape, string } from "prop-types";
import { Button, ButtonGroup, Card, Classes, Collapse, Divider, Tag } from "@blueprintjs/core";

import ButtonLink from "../../ButtonLink";
import CitekeyPopover from "../../CitekeyPopover";
import ErrorCallout from "../../Errors/ErrorCallout";
import { useRoamCitekeys } from "../../RoamCitekeysContext";
import SciteBadge from "../../SciteBadge";
import SemanticPanel from "../SemanticPanel";

import { showClasses } from "../classes";
import { useQuery_Semantic } from "../../../api/queries";
import { findRoamPage, importItemMetadata, importItemNotes } from "../../../roam";
import { cleanLibraryItem, cleanSemantic, compareItemsByYear, getLocalLink, getPDFLink, getWebLink, identifyChildren, parseDOI, pluralize } from "../../../utils";
import AuxiliaryDialog from "../../AuxiliaryDialog";
import ItemDetails from "../../ItemDetails";

import SentryBoundary from "../../Errors/SentryBoundary";
import { UserSettings } from "../../App";
import * as customPropTypes from "../../../propTypes";

function BacklinksItem({ entry }) {
	const { _type, inLibrary, inGraph } = entry;
	const { children: { pdfs, notes }, raw: item} = inLibrary;
	const { key, data, meta } = item;

	const pub_year = meta.parsedDate ? new Date(meta.parsedDate).getUTCFullYear() : "";
	const pub_type = _type == "cited" ? "reference" : "citation";

	const itemActions = useMemo(() => {
		return <CitekeyPopover 
			inGraph={inGraph} 
			item={item}
			notes={notes}
			pdfs={pdfs} />;
	}, [inGraph, item, notes, pdfs]);

	return (
		<li className="zr-backlink-item" 
			data-backlink-type={pub_type} 
			data-in-graph={(inGraph != false).toString()} 
			data-item-year={pub_year}
			data-key={"@" + key}
		>
			<div className="zr-backlink-item--year">{pub_year}</div>
			<div className="zr-backlink-item--info" data-item-type={data.itemType} >
				<span zr-role="item-authors" className={pub_type == "reference" ? "zr-accent-1" : "zr-accent-2"}>{meta.creatorSummary || ""}</span>
				<span zr-role="item-publication" className="zr-secondary">{data.publicationTitle || data.bookTitle || data.university || ""}</span>
				<span zr-role="item-title">{data.title}</span>
			</div>
			<div className="zr-backlink-item--state">
				{itemActions}
			</div>
		</li>
	);
}
BacklinksItem.propTypes = {
	entry: customPropTypes.cleanSemanticReturnType.isRequired
};

const Backlinks = React.memo(function Backlinks(props) {
	const { isOpen, items = [], origin } = props;

	if(items.length == 0){
		return null;
	} else {
		let itemList = [...items];
		const sortedItems = itemList.sort((a,b) => compareItemsByYear(a.inLibrary.raw, b.inLibrary.raw));
		const references = sortedItems.filter(it => it._type == "cited");
		const citations = sortedItems.filter(it => it._type == "citing");

		const separator = <span>
			<Tag className="zr-backlinks-divider--tag" minimal={true} multiline={true}>{origin}</Tag>
			<Divider />
		</span>;

		return (
			<Collapse isOpen={isOpen} keepChildrenMounted={true}>
				<ul className={[ Classes.LIST_UNSTYLED, "zr-citekey-menu--backlinks"].join(" ")}>
					{references.length > 0 
						? <ul className={Classes.LIST_UNSTYLED} zr-role="sublist" list-type="references">
							{references.map((ref) => <BacklinksItem key={ref.doi} entry={ref} />)}
						</ul> 
						: null}
					{(references.length > 0 && citations.length > 0)
						? separator
						: null}
					{citations.length > 0 
						? <ul className={Classes.LIST_UNSTYLED} zr-role="sublist" list-type="citations">
							{citations.map((cit) => <BacklinksItem key={cit.doi} entry={cit} />)}
						</ul> 
						: null}
				</ul>
			</Collapse>
		);
	}
});
Backlinks.propTypes = {
	isOpen: bool,
	items: arrayOf(customPropTypes.cleanSemanticReturnType),
	origin: string
};

function RelatedItemsBar(props) {
	const { doi, itemList, origin, title } = props;
	const [roamCitekeys,] = useRoamCitekeys();
	const { isLoading, isError, data = {}, error } = useQuery_Semantic(doi);
	
	const [isBacklinksListOpen, setBacklinksListOpen] = useState(false);
	const [isDialogOpen, setDialogOpen] = useState(false);
	const [isShowing, setShowing] = useState({title, type: "is_reference"});

	const toggleBacklinks = useCallback(() => {
		setBacklinksListOpen(!isBacklinksListOpen);
	}, [isBacklinksListOpen]);

	const openDialog = useCallback(() => {
		setDialogOpen(true);
	}, []);

	const closeDialog = useCallback(() => {
		setDialogOpen(false);
	}, []);

	const showReferences = useCallback(() => {
		setShowing({
			title,
			type: "is_reference"
		});
		openDialog();
	}, [title, openDialog]);

	const showCitations = useCallback(() => {
		setShowing({
			title,
			type: "is_citation"
		});
		openDialog();
	}, [title, openDialog]);

	const refCount = data.references?.length || null;
	const citCount = data.citations?.length || null;

	const cleanSemanticData = useMemo(() => {
		if(!data){
			return {
				backlinks: [],
				citations: [],
				references: []
			};
		} else {
			let { citations = [], references = [] } = data;
			return cleanSemantic(itemList, { citations, references }, roamCitekeys);
		}
	}, [data, itemList, roamCitekeys]);

	const showBacklinksButtonProps = useMemo(() => {
		return cleanSemanticData.backlinks.length == 0
			? {
				disabled: true,
				icon: null,
				text: "No related library items"
			}
			: {
				icon: isBacklinksListOpen ? "caret-down" : "caret-right",
				text: pluralize(cleanSemanticData.backlinks.length, "related library item")
			};
	}, [cleanSemanticData.backlinks.length, isBacklinksListOpen]);

	return (
		<div className="zotero-roam-page-menu-citations">
			{isError
				? <ErrorCallout error={error} />
				:
				<>
					<ButtonGroup minimal={true} fill={true}>
						<Button className={ showClasses.references } loading={isLoading} onClick={showReferences} icon="citation" intent="primary">{ pluralize(refCount, "reference") }</Button>
						<Button className={ showClasses.citations } loading={isLoading} onClick={showCitations} icon="chat" intent="warning" >{ pluralize(citCount, "citation") }</Button>
						<Button className={ showClasses.backlinks } loading={isLoading} onClick={toggleBacklinks} {...showBacklinksButtonProps} ></Button>
					</ButtonGroup>
					{refCount + citCount > 0
						? <SemanticPanel
							isOpen={isDialogOpen} 
							items={cleanSemanticData}
							onClose={closeDialog}
							show={isShowing} />
						: null}
					<Backlinks isOpen={isBacklinksListOpen} items={cleanSemanticData.backlinks} origin={origin} />
				</>
			}
		</div>
	);
}
RelatedItemsBar.propTypes = {
	doi: string,
	itemList: shape({
		items: arrayOf(customPropTypes.zoteroItemType),
		pdfs: arrayOf(customPropTypes.zoteroItemType),
		notes: arrayOf(customPropTypes.zoteroItemType),
	}),
	origin: string,
	title: string
};

function ViewItem(props) {
	const { item } = props;
	const [isPanelOpen, setPanelOpen] = useState(false);

	const closePanel = useCallback(() => {
		setPanelOpen(false);
	}, []);

	const openPanel = useCallback(() => {
		setPanelOpen(true);
	}, []);

	return (
		<>
			<Button icon="info-sign" onClick={openPanel}>View item information</Button>
			<AuxiliaryDialog
				className="view-item-information"
				isOpen={isPanelOpen}
				onClose={closePanel}>
				<ItemDetails
					closeDialog={closePanel}
					item={item}
				/>
			</AuxiliaryDialog>
		</>
	);
}
ViewItem.propTypes = {
	item: customPropTypes.cleanLibraryItemType
};

const CitekeyMenu = React.memo(function CitekeyMenu(props) {
	const { item, itemList } = props;
	const { 
		annotations: annotationsSettings, 
		metadata: metadataSettings, 
		notes: notesSettings, 
		pageMenu: { defaults }, 
		sciteBadge: sciteBadgeSettings, 
		typemap } = useContext(UserSettings);
	const [roamCitekeys,] = useRoamCitekeys();

	const doi = parseDOI(item.data.DOI);
	const pageUID = findRoamPage("@" + item.key);

	const children = useMemo(() => {
		let itemKey = item.data.key;
		let location = item.library.type + "s/" + item.library.id;
		let { pdfs, notes } = itemList;

		return identifyChildren(itemKey, location, { pdfs: pdfs, notes: notes });
	}, [itemList, item]);

	const doiHeader = useMemo(() => {
		return doi 
			? <span className="zr-citekey-doi" data-doi={doi}><a href={"https://doi.org/" + doi} target="_blank" rel="noreferrer">{doi}</a></span> 
			: null;
	}, [doi]);

	const importMetadata = useCallback(async() => {
		let { pdfs, notes } = children;
		return await importItemMetadata({ item, pdfs, notes }, pageUID, metadataSettings, typemap, notesSettings, annotationsSettings);
	}, [annotationsSettings, children, item, metadataSettings, notesSettings, pageUID, typemap]);
    
	const importNotes = useCallback(async() => {
		return await importItemNotes({item, notes: children.notes }, pageUID, notesSettings, annotationsSettings);
	}, [annotationsSettings, children.notes, item, notesSettings, pageUID]);

	const pdfLinks = useMemo(() => {
		if(children.pdfs.length == 0 || !defaults.includes("pdfLinks")) {
			return null;
		} else {
			return (
				children.pdfs.map(pdf => {
					return (
						<ButtonLink zr-role="pdf-link" key={pdf.key}
							alignText="left"
							href={getPDFLink(pdf, "href")}
							icon="paperclip"
							minimal={true}
							text={pdf.data.filename || pdf.data.title} />
					);
				})
			);
		}
	}, [defaults, children.pdfs]);

	const notesButton = useMemo(() => {
		if(children.notes.length == 0 || !defaults.includes("importNotes")){
			return null;
		} else {
			return <Button icon="comment" onClick={importNotes}>Import notes</Button>;
		}
	}, [defaults, importNotes, children.notes.length]);
    
	const open_zotero = useMemo(() => {
		return (
			<>
				{defaults.includes("openZoteroLocal")
					? <ButtonLink icon="application" text="Open in Zotero" href={getLocalLink(item, { format: "target" })} />
					: null}
				{defaults.includes("openZoteroWeb")
					? <ButtonLink icon="cloud" text="Open in Zotero [Web library]" href={getWebLink(item, { format: "target" })} />
					: null}
			</>
		);
	},[defaults, item]);

	const sciteBadge = useMemo(() => {
		return doi && defaults.includes("sciteBadge") ? <SciteBadge doi={doi} {...sciteBadgeSettings} /> : null;
	}, [defaults, doi, sciteBadgeSettings]);

	const ext_links = useMemo(() => {
		let connectedPapersLink = defaults.includes("connectedPapers")
			? <ButtonLink icon="layout" intent="primary" text="Connected Papers" href={"https://www.connectedpapers.com/" + (doi ? "api/redirect/doi/" + doi : "search?q=" + encodeURIComponent(item.data.title)) } />
			: null;
		let semanticLink = doi && defaults.includes("semanticScholar") 
			? <ButtonLink icon="bookmark" intent="primary" text="Semantic Scholar" href={"https://api.semanticscholar.org/" + doi} /> 
			: null;
		let googleScholarLink = defaults.includes("googleScholar")
			? <ButtonLink icon="learning" intent="primary" text="Google Scholar" href={"https://scholar.google.com/scholar?q=" + (doi || encodeURIComponent(item.data.title))} />
			: null;

		return (
			<>
				{connectedPapersLink}
				{semanticLink}
				{googleScholarLink}
			</>
		);
	}, [defaults, doi, item.data.title]);
    
	const relatedBar = useMemo(() => {
		return doi && defaults.includes("citingPapers")
			? <RelatedItemsBar doi={doi}
				itemList={itemList}
				origin={item.meta.parsedDate ? new Date(item.meta.parsedDate).getUTCFullYear().toString() : ""} 
				title={"@" + item.key}
			/>
			: null;
	}, [defaults, doi, item.key, item.meta.parsedDate, itemList]);

	const clean_item = useMemo(() => {
		return cleanLibraryItem(item, children.pdfs, children.notes, roamCitekeys);
	}, [children, item, roamCitekeys]);

	return (
		<SentryBoundary feature="menu-citekey" extra={item}>
			{doiHeader}
			<Card elevation={0} className="zr-citekey-menu">
				<div className="zr-citekey-menu--header">
					<ButtonGroup className="zr-citekey-menu--actions" minimal={true}>
						{defaults.includes("addMetadata")
							? <Button icon="add" onClick={importMetadata}>Add metadata</Button>
							: null}
						{notesButton}
						{defaults.includes("viewItemInfo")
							? <ViewItem item={clean_item} />
							: null}
						{open_zotero}
						{pdfLinks}
						{ext_links}
					</ButtonGroup>
					{sciteBadge}
				</div>
				{relatedBar}
			</Card>
		</SentryBoundary>
	);
});
CitekeyMenu.propTypes = {
	item: customPropTypes.zoteroItemType,
	itemList: shape({
		items: arrayOf(customPropTypes.zoteroItemType),
		pdfs: arrayOf(customPropTypes.zoteroItemType),
		notes: arrayOf(customPropTypes.zoteroItemType),
	})
};

export default CitekeyMenu;
