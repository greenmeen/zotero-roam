import { arrayOf, bool, func, object, string } from "prop-types";
import { memo, useCallback } from "react";

import { Button, Checkbox, Classes, Tag } from "@blueprintjs/core";

import AuxiliaryDialog from "Components/AuxiliaryDialog";
import { CitoidGuide } from "Components/Guide";
import ErrorBoundary from "Components/Errors/ErrorBoundary";
import ZoteroImport from "Components/ZoteroImport";

import useMulti from "../../../hooks/useMulti";
import { useQuery_Citoid } from "../../../api/citoid";
import { useTypemapSettings } from "Components/UserSettings/Typemap";

import { pluralize } from "../../../utils";

import { CustomClasses } from "../../../constants";


function useGetCitoids(urls, opts = {}) {
	return useQuery_Citoid(urls, {
		...opts,
		select: (data) => {
			const { item, query } = data;
			
			return {
				abstract: item.abstractNote || "",
				creators: item.creators?.map(cre => cre.name || [cre.firstName, cre.lastName].filter(Boolean).join(" ")).join(", "),
				itemType: item.itemType, 
				publication: item.publicationTitle || item.bookTitle || item.websiteTitle || "",
				title: item.title,
				url: query
			};
		},
		notifyOnChangeProps: ["data", "isLoading"]
	});
}

const WebImportItem = memo(function WebImportItem(props){
	const { isSelected, item, onSelect } = props;
	const [typemap] = useTypemapSettings();

	const handleCheckUncheck = useCallback(() => {
		onSelect(item.url);
	}, [item.url, onSelect]);
    
	return (
		<li className="zr-webimport-item" aria-label={item.url} onClick={handleCheckUncheck} >
			<div className={ Classes.MENU_ITEM }>
				<div className="zr-webimport-item--header" >
					<Checkbox
						checked={isSelected}
						className="zr-webimport-item--title"
						inline={false}
						labelElement={<>
							<a target="_blank" rel="noreferrer" href={item.url}>{item.title}</a>
							{item.creators
								? <span className={CustomClasses.TEXT_SECONDARY} zr-role="item-creators" > ({item.creators})</span>
								: null}
						</>}
						onChange={handleCheckUncheck}
					/>
					{item.itemType
						? <Tag htmlTitle={item.publication} minimal={true} zr-role="item-type">
							<span data-item-type={item.itemType} >{typemap[item.itemType] || item.itemType}</span>
						</Tag>
						: null}
				</div>
				<div className="zr-webimport-item--contents" >
					<span className={[CustomClasses.TEXT_SMALL, CustomClasses.TEXT_AUXILIARY].join(" ")} zr-role="item-abstract">
						{item.abstract}
					</span>
				</div>
			</div>
		</li>
	);
});
WebImportItem.propTypes = {
	isSelected: bool,
	item: object,
	onSelect: func
};

const WebImportPanel = memo(function WebImportPanel(props){
	const { isOpen, onClose, urls } = props;
	const [selected, { set: setSelected, toggle: onItemSelect }] = useMulti({
		start: []
	});
	const has_selected_items = selected.length > 0;

	const citoidQueries = useGetCitoids(urls, { enabled: isOpen });
	const noQueriesLoaded = citoidQueries.every(q => q.isLoading);
	const citoids = citoidQueries.filter(q => q.isSuccess).map(q => q.data);

	const handleClose = useCallback(() => {
		setSelected();
		onClose();
	}, [onClose, setSelected]);

	return (
		<AuxiliaryDialog
			ariaLabelledBy="zr-webimport-dialog--title"
			className="webimport"
			extraClasses={has_selected_items ? ["has-selected-items"] : []}
			isOpen={isOpen}
			onClose={handleClose} >
			<div className={ Classes.DIALOG_BODY }>
				<ErrorBoundary>
					<div className="zr-webimport-panel--main">
						<div className="header-content">
							<div className="header-left">
								<h5 id="zr-webimport-dialog--title" className="panel-tt">
									{noQueriesLoaded
										? "Parsing links..."
										: pluralize(citoids.length, "link", " found")}
								</h5>
								{!noQueriesLoaded && <CitoidGuide />}
							</div>
							<div className={["header-right", CustomClasses.TEXT_AUXILIARY].join(" ")}>
								<Button icon="cross" large={true} minimal={true} onClick={handleClose} title="Close dialog" />
							</div>
						</div>
						<div className="rendered-div">
							<ul className={ Classes.LIST_UNSTYLED }>
								{citoids.map(cit => <WebImportItem key={cit.url} item={cit} isSelected={selected.includes(cit.url)} onSelect={onItemSelect} />)}
							</ul>
						</div>
					</div>
					<div className="zr-webimport-panel--side" tabIndex={0}>
						<ZoteroImport identifiers={selected} isActive={has_selected_items} resetImport={setSelected} />
					</div>
				</ErrorBoundary>
			</div>
		</AuxiliaryDialog>
	);
});
WebImportPanel.propTypes = {
	isOpen: bool,
	onClose: func,
	urls: arrayOf(string)
};

export default WebImportPanel;
