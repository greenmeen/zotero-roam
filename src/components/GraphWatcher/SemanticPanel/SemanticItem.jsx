import React, { useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { Button, Classes, Icon, Tag } from "@blueprintjs/core";

import CitekeyPopover from "../CitekeyPopover";

import * as customPropTypes from "../../../propTypes";

const SemanticItem = React.memo(function SemanticItem(props) {
	const { handleRemove, handleSelect, inGraph, isSelected, item, metadataSettings, type } = props;
	const { inLibrary } = item;

	const handleClick = useCallback(() => {
		if(isSelected){
			handleRemove(item);
		} else {
			handleSelect(item);
		}
	}, [isSelected, item, handleRemove, handleSelect]);

	const itemActions = useMemo(() => {
		if(!inLibrary){
			return (
				<>
					{item.url
						? <a href={item.url} target="_blank" rel="noreferrer"
							zr-role="item-url"
							className={[ Classes.TEXT_MUTED, "zr-text-small"].join(" ")} >
							{item.doi || "Semantic Scholar"}
						</a>
						: null}
					<Button text="Add to Zotero" 
						active={isSelected}
						className="zr-text-small" 
						icon={isSelected ? "small-cross" : "small-plus"} 
						intent="primary" 
						minimal={true} 
						onClick={handleClick}
						small={true} />
				</>
			);
		} else {
			let { children: { pdfs, notes }, raw} = inLibrary;
			return (
				<CitekeyPopover inGraph={inGraph} item={raw} metadataSettings={metadataSettings} notes={notes} pdfs={pdfs} />
			);
		}
	}, [handleClick, inGraph, inLibrary, isSelected, item.doi, item.url, metadataSettings]);

	return (
		<li className="zr-related-item" data-semantic-type={type} data-in-library={inLibrary != false} data-in-graph={inGraph != false}>
			<div className={ Classes.MENU_ITEM } label={item.doi}>
				<span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zr-related-item--timestamp"].join(" ")}>
					{item.year}
				</span>
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{display: "flex"}}>
						<div className="zr-related-item-contents--metadata">
							<span className={type == "is_reference" ? "zr-highlight" : "zr-highlight-2"}>{item.authors}</span>
							<span className="zr-secondary">{item.meta}</span>
							{item.isInfluential
								? <Icon className="zr-related-item--decorating-icon" color="#f8c63a" htmlTitle="This item was classified as influential by Semantic Scholar" icon="trending-up" />
								: null}
							<span className="zr-item-title" style={{ whiteSpace: "normal" }}>{item.title}</span>
							<div className="zr-related-item--links">
								{Object.keys(item.links).map((key) => {
									return (
										<span key={key} data-service={key}>
											<a href={item.links[key]} className="zr-text-small" target="_blank" rel="noreferrer">{key.split("-").map(key => key.charAt(0).toUpperCase() + key.slice(1)).join(" ")}</a>
										</span>
									);
								})}
							</div>
						</div>
						<span className="zr-related-item-contents--actions">
							{itemActions}
						</span>
					</div>
					<div className="zr-related-item--intents">
						{item.intent.length > 0
							? item.intent.map(int => {
								let capitalizedIntent = int.charAt(0).toUpperCase() + int.slice(1);
								return <Tag key={int} data-semantic-intent={int} htmlTitle={"This citation was classified as related to " + capitalizedIntent + " by Semantic Scholar"} minimal={true}>{capitalizedIntent}</Tag>;})
							: null}
					</div>
				</div>
			</div>
		</li>
	);
});
SemanticItem.propTypes = {
	handleRemove: PropTypes.func,
	handleSelect: PropTypes.func,
	inGraph: PropTypes.oneOf([PropTypes.string, false]),
	isSelected: PropTypes.bool,
	item: customPropTypes.cleanSemanticReturnType,
	metadataSettings: PropTypes.object,
	type: PropTypes.oneOf(["is_reference", "is_citation"])
};

export default SemanticItem;
