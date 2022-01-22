import React, { useMemo } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import { useQuery_Items } from "../../../queries";
import { categorizeLibraryItems } from "../../../utils";

import CitekeyMenu from "./CitekeyMenu";
import DNPMenu from "./DNPMenu";
import TagMenu from "./TagMenu";

import { addPageMenus, cleanRelatedItem, findPageMenus } from "./utils";
import "./index.css";

const sharedPropTypes = { 
	dataRequests: PropTypes.array,
	menus: PropTypes.arrayOf(PropTypes.node),
	metadataSettings: PropTypes.object,
	portalId: PropTypes.string,
	roamCitekeys: PropTypes.instanceOf(Map)
};

function CitekeyMenuFactory(props){
	const { dataRequests, menus, metadataSettings, portalId, roamCitekeys } = props;
	const itemQueries = useQuery_Items(dataRequests, { 
		select: (datastore) => datastore.data, 
		notifyOnChangeProps: ["data"] 
	});

	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	const citekeyItems = useMemo(() => itemList.items.filter(it => it.has_citekey), [itemList]);
	const citekeyMenus = useMemo(() => {
		if (!citekeyItems) {
			return null;
		} else {
			return menus.map(menu => {
				let item = citekeyItems.find(it => it.key == menu.getAttribute("data-citekey"));
				return { div: menu, item };
			})
				.filter(menu => menu.item)
				.map((menu, i) => {
					let { item, div } = menu;
					return (
						createPortal(<CitekeyMenu key={i} item={item} itemList={itemList} metadataSettings={metadataSettings} portalId={portalId} roamCitekeys={roamCitekeys} />, div)
					);
				});
		}
	}, [citekeyItems, itemList, menus, metadataSettings, portalId, roamCitekeys]);

	return citekeyMenus;
}
CitekeyMenuFactory.propTypes = sharedPropTypes;

function DNPMenuFactory(props){
	const { dataRequests, menus, metadataSettings, portalId, roamCitekeys } = props;
	const itemQueries = useQuery_Items(dataRequests, { 
		select: (datastore) => datastore.data, 
		notifyOnChangeProps: ["data"] 
	});

	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);
	
	const dnpPortals = useMemo(() => {
		let { items, pdfs, notes } = itemList;

		if(!items){
			return null;
		} else {
			return menus.map(menu => {
				let title = menu.getAttribute("data-title");
				let dnp_date = new Date(JSON.parse(menu.getAttribute("data-dnp-date"))).toDateString();
				let added = items
					.filter(it => new Date(it.data.dateAdded).toDateString() == dnp_date)
					.map(it => cleanRelatedItem(it, {pdfs, notes}, roamCitekeys));
				return { div: menu, added, date: dnp_date, title};
			})
				.filter(menu => menu.added)
				.map((menu, i) => {
					let { added, date, div, title } = menu;
					return (
						createPortal(<DNPMenu key={i} 
							added={added} date={date} title={title} 
							metadataSettings={metadataSettings} portalId={portalId} />, div)
					);
				});
		}
	}, [itemList, menus, metadataSettings, portalId, roamCitekeys]);

	return dnpPortals;
}
DNPMenuFactory.propTypes = sharedPropTypes;

function TagMenuFactory(props){
	const { dataRequests, menus, metadataSettings, portalId, roamCitekeys } = props;
	const itemQueries = useQuery_Items(dataRequests, { 
		select: (datastore) => datastore.data, 
		notifyOnChangeProps: ["data"] 
	});

	const data = itemQueries.map(q => q.data || []).flat(1);
	const itemList = useMemo(() => categorizeLibraryItems(data), [data]);

	// Select to reduce dataset size :
	// - for tag matching, only top-level items that have any tags
	// - for abstract matching, only items that have an abstract
	const with_tags_or_abstract = useMemo(() => {
		return itemList.items
			.filter(it => it.data.abstractNote || it.data.tags.length > 0)
			.map(it => {
				return {
					itemData: it,
					abstract: it.data.abstractNote || "",
					tagList: it.data.tags.map(t => t.tag)
				};
			});
	}, [itemList.items]);

	const tagPortals = useMemo(() => {
		let { items, pdfs, notes } = itemList;
		if(!items){
			return null;
		} else {
			return menus.map(menu => {
				let title = menu.getAttribute("data-title");
				let results = with_tags_or_abstract.reduce((obj, item) => {
					if(item.abstract.includes(title)){
						obj.with_abstract.push(cleanRelatedItem(item.itemData, { pdfs, notes }, roamCitekeys));
					}
					if(item.tagList.includes(title)){
						obj.with_tags.push(cleanRelatedItem(item.itemData, { pdfs, notes }, roamCitekeys));
					}
					return obj;
				}, { with_tags: [], with_abstract: []});
                
				return { div: menu, tag: title, ...results };
			})
				.filter(menu => menu.with_tags.length > 0 || menu.with_abstract.length > 0)
				.map((menu,i) => {
					let { with_tags, with_abstract, div, tag } = menu;
					return (
						createPortal(<TagMenu key={i} 
							tag={tag} inAbstract={with_abstract} tagged={with_tags} 
							metadataSettings={metadataSettings} portalId={portalId} />, div)
					);
				});
		}
	}, [itemList, menus, metadataSettings, portalId, roamCitekeys, with_tags_or_abstract]);

	return tagPortals;
}
TagMenuFactory.propTypes = sharedPropTypes;

export {
	addPageMenus,
	findPageMenus,
	CitekeyMenuFactory,
	DNPMenuFactory,
	TagMenuFactory
};
