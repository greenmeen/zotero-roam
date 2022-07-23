import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { arrayOf, func, oneOf, shape } from "prop-types";
import { Spinner, Tab, Tabs } from "@blueprintjs/core";

import { ExtensionContext } from "../../App";
import { ListItem, ListWrapper } from "../../DataList";
import SentryBoundary from "../../Errors/SentryBoundary";
import QueryBuilder from "./QueryBuilder";
import QueryPDFs from "./QueryPDFs";
import { useRoamCitekeys } from "../../RoamCitekeysContext";

import { useQuery_Items } from "../../../api/queries";
import { categorizeLibraryItems, cleanLibraryItem, cleanLibraryPDF, identifyChildren, identifyPDFConnections } from "../../../utils";

import { CustomClasses } from "../../../constants";
import * as customPropTypes from "../../../propTypes";
import "./index.css";

function cleanLibraryData(itemList, roamCitekeys){
	return new Promise((resolve) => {
		setTimeout(() => {
			const data = itemList.items
				.map(item => {
					let itemKey = item.data.key;
					let location = item.library.type + "s/" + item.library.id;
					let { pdfs, notes } = identifyChildren(itemKey, location, { pdfs: itemList.pdfs, notes: itemList.notes });

					return cleanLibraryItem(item, pdfs, notes, roamCitekeys);
				});
			resolve(data);
		}, 0);
	});
}

function cleanLibraryData_PDF(itemList){
	return new Promise((resolve) => {
		setTimeout(() => {
			const data = itemList.pdfs
				.map(pdf => {
					let itemKey = pdf.data.key;
					let parentKey = pdf.data.parentItem;
					let location = pdf.library.type + "s/" + pdf.library.id;
					let { parent, annotations } = identifyPDFConnections(itemKey, parentKey, location, { items: itemList.items, notes: itemList.notes });
					
					return cleanLibraryPDF(pdf, parent, annotations);
				});
			resolve(data);
		}, 0);
	});
}

function TabContents({ itemList, onClose, show }){
	const [roamCitekeys,] = useRoamCitekeys();
	const [filteredData, setFilteredData] = useState(null);

	useEffect(() => {
		if(itemList){
			switch(show){
			case "pdfs":
				cleanLibraryData_PDF(itemList)
					.then(data => {
						setFilteredData(data);
					});
				break;
			case "notes":
				setFilteredData(itemList.notes);
				break;
			case "items":
			default:
				cleanLibraryData(itemList, roamCitekeys)
					.then(data => {
						setFilteredData(data);
					});
			}
		}
	}, [itemList, roamCitekeys, show]);

	return filteredData == null
		? <Spinner size={15} title="Loading items..." />
		: show == "items" 
			? <QueryBuilder items={filteredData} onClose={onClose} />
			: show == "pdfs"
				? <QueryPDFs items={filteredData} />
				: <ListWrapper>{filteredData.slice(0,20).map((it, i) => <ListItem key={it.key + "-" + i}>{it.key}</ListItem>)}</ListWrapper>;
}
TabContents.propTypes = {
	itemList: shape({
		items: arrayOf(customPropTypes.zoteroItemType),
		pdfs: arrayOf(customPropTypes.zoteroItemType),
		notes: arrayOf(customPropTypes.zoteroItemType)
	}),
	onClose: func,
	show: oneOf(["items", "pdfs", "notes"])
};

function ExplorerTabs({ itemList, onClose }){
	const [activeTab, setActiveTab] = useState("items");
	const selectTab = useCallback((newtab, _prevtab, _event) => setActiveTab(newtab), []);
	
	return (
		<Tabs 
			animate={false}
			className={CustomClasses.TABS_MINIMAL} 
			id="explorer-lists" 
			onChange={selectTab}
			renderActiveTabPanelOnly={false}
			selectedTabId={activeTab} >
			<Tab id="items" title="Items" 
				panel={<TabContents itemList={itemList} onClose={onClose} show="items" />} 
			/>
			<Tab id="pdfs" title="PDFs" 
				panel={<TabContents itemList={itemList} onClose={onClose} show="pdfs" />} 
			/>
			<Tab id="notes" title="Notes"
				panel={<TabContents itemList={itemList} onClose={onClose} show="notes" />}
			/>
		</Tabs>
	);
}
ExplorerTabs.propTypes = {
	itemList: shape({
		items: arrayOf(customPropTypes.zoteroItemType),
		pdfs: arrayOf(customPropTypes.zoteroItemType),
		notes: arrayOf(customPropTypes.zoteroItemType)
	}),
	onClose: func
};

function Explorer({ onClose }){
	const { dataRequests } = useContext(ExtensionContext);
	const itemQueries = useQuery_Items(dataRequests, {
		notifyOnChangeProps: ["data"],
		select: (datastore) => datastore.data
	});

	const isLoading = itemQueries.some(q => q.isLoading);
	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	return <SentryBoundary feature="data-explorer">
		<div>
			{isLoading
				? <Spinner title="Loading libraries..." />
				: <ExplorerTabs itemList={itemList} onClose={onClose} /> }
		</div>
	</SentryBoundary>;
}
Explorer.propTypes = {
	onClose: func
};

export default Explorer;