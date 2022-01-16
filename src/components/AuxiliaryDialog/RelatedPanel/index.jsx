import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Button, Classes } from "@blueprintjs/core";

import { pluralize, sortItems } from "../../../utils";
import { getCitekeyPages } from "../../../roam";

const RelatedItem = React.memo(function RelatedItem(props) {
	const { item, type, inGraph, allAbstractsShown } = props;
	const [isAbstractVisible, setAbstractVisible] = useState(allAbstractsShown);

	const toggleAbstract = useCallback(() => {
		setAbstractVisible(!isAbstractVisible);
	}, [isAbstractVisible]);

	const buttonProps = useMemo(() => {
		if(inGraph){
			return {
				icon: "symbol-circle",
				intent: "success",
				"data-citekey": item.key,
				"data-uid": inGraph,
				text: "Go to @" + item.key
			};
		} else {
			return {
				icon: "plus",
				text: "@" + item.key
			};
		}
	}, [inGraph]);

	useEffect(() => {
		setAbstractVisible(allAbstractsShown);
	}, [allAbstractsShown]);

	return (
		<li className="zr-related-item" data-item-type={item.itemType}>
			<div className={ Classes.MENU_ITEM } label={item.key}>
				{type == "added_on"
					? <span className={[Classes.MENU_ITEM_LABEL, "zr-text-small", "zr-related-item--timestamp"].join(" ")}>
						{item.timestamp}
					</span>
					: null}
				<div className={[Classes.FILL, "zr-related-item-contents"].join(" ")}>
					<div className={ Classes.FILL } style={{display: "flex"}}>
						<div className="zr-related-item-contents--metadata">
							<span className="zotero-roam-search-item-title" style={{ whiteSpace: "normal" }}>{item.title}</span>
							<span className="zr-highlight">{item.meta}</span>
						</div>
						<span className="zr-related-item-contents--actions">
							<Button className="zr-text-small" minimal={true} small={true} {...buttonProps} />
						</span>
					</div>
					<div className="zr-related-item--abstract">
						{item.abstract
							? <Button className={ [Classes.ACTIVE, "zr-text-small"].join(" ") }
								zr-role="abstract-toggle"
								icon={isAbstractVisible ? "chevron-down" : "chevron-right"}
								onClick={toggleAbstract} 
								intent="primary" 
								minimal={true} 
								small={true}>Abstract</Button>
							: null}
						{item.abstract && isAbstractVisible
							? <span zr-role="abstract-text" className="zr-text-small zr-auxiliary">{item.abstract}</span>
							: null}
					</div>
				</div>
			</div>
		</li>
	);
});
RelatedItem.propTypes = {
	item: PropTypes.object,
	type: PropTypes.oneOf(["added_on", "has_abstract", "has_tag", "is_citation", "is_reference"]),
	inGraph: PropTypes.oneOf([PropTypes.string, false]),
	allAbstractsShown: PropTypes.bool,
};

const RelatedPanel = React.memo(function RelatedPanel(props) {
	const { items, type, sort, title, onClose, ariaLabelledBy } = props;
	const [isShowingAllAbstracts, setShowingAllAbstracts] = useState(false);

	const toggleAbstracts = useCallback(() => {
		setShowingAllAbstracts(!isShowingAllAbstracts);
	}, [isShowingAllAbstracts]);

	const sortedItems = useMemo(() => {
		return sortItems(items, sort);
	}, [items]);

	const relationship = useMemo(() => {
		switch(type){
		case "added_on":
			return {
				string: "item",
				suffix: " added on " + title
			};
		case "has_abstract":
			return {
				string: "abstract",
				suffix: " containing " + title
			};
		case "has_tag":
			return {
				string: "item",
				suffix: " tagged with " + title
			};
		}
	}, [type]);

	const roamCitekeys = getCitekeyPages();

	return (
		<>
			<div className="header-content">
				<div className="header-left">
					<h5 id={ariaLabelledBy} className="panel-tt">{pluralize(sortedItems.length, relationship.string, relationship.suffix)}</h5>
					<Button className={[Classes.ACTIVE, "zr-text-small"].join(" ")} zr-role="toggle-abstracts" icon={isShowingAllAbstracts ? "eye-off" : "eye-open"} minimal={true} onClick={toggleAbstracts}>{isShowingAllAbstracts ? "Hide" : "Show"} all abstracts</Button>
				</div>
				<div className={["header-right", "zr-auxiliary"].join(" ")}>
					<Button icon="small-cross" minimal={true} onClick={onClose} />
				</div>
			</div>
			<div className="rendered-div">
				<ul className={Classes.LIST_UNSTYLED}>
					{sortedItems.map(it => {
						let inGraph = roamCitekeys.has("@" + it.key) ? roamCitekeys.get("@" + it.key) : false;
						return (
							<RelatedItem key={[it.location, it.key].join("-")} inGraph={inGraph} allAbstractsShown={isShowingAllAbstracts} item={it} type={type} />
						);
					})
					}
				</ul>
			</div>
		</>
	);
});
RelatedPanel.propTypes = {
	items: PropTypes.array,
	type: PropTypes.oneOf(["added_on", "has_abstract", "has_tag", "is_citation", "is_reference"]),
	sort: PropTypes.oneOf(["added", "meta"]),
	title: PropTypes.string,
	onClose: PropTypes.func,
	ariaLabelledBy: PropTypes.string,
};

export default RelatedPanel;
