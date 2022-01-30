import React, { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { MenuItem } from "@blueprintjs/core";
import { MultiSelect } from "@blueprintjs/select";

import { getAllPages } from "../../roam";

const createNewItemFromQuery = (tag) => tag;
const tagRenderer = (tag) => tag;

function createNewItemRenderer(query, active, handleClick){
	return <MenuItem active={active} icon="small-plus" onClick={handleClick} text={query} />;
}

function itemRenderer(item, itemProps) {
	let { handleClick, modifiers: { active } } = itemProps;
	return <MenuItem active={active} onClick={handleClick} text={item} />;
}

function itemPredicate(query, item) {
	return item.toLowerCase().includes(query.toLowerCase());
}

const TagsSelector = React.memo(function TagsSelector(props) {
	const { selectedTags, setSelectedTags } = props;
	const [roamPages,] = useState(getAllPages());

	const addTag = useCallback((tag, _event) => {
		setSelectedTags(currentTags => {
			if(!currentTags.includes(tag)){
				return [...currentTags, tag];
			}
		});
	}, [setSelectedTags]);

	const removeTag = useCallback((tag, _index) => {
		setSelectedTags(currentTags => {
			return currentTags.filter(t => t != tag);
		});
	}, [setSelectedTags]);

	const tagInputProps = useMemo(() => {
		return {
			leftIcon: "tag",
			tagProps: {
				minimal: true
			}
		};
	}, []);

	return (
		<MultiSelect
			createNewItemFromQuery={createNewItemFromQuery}
			createNewItemPosition="first"
			createNewItemRenderer={createNewItemRenderer}
			fill={true}
			initialContent={null}
			itemPredicate={itemPredicate}
			itemRenderer={itemRenderer}
			items={roamPages}
			onItemSelect={addTag}
			onRemove={removeTag}
			openOnKeyDown={true}
			placeholder="Add tags from Roam"
			selectedItems={selectedTags}
			tagInputProps={tagInputProps}
			tagRenderer={tagRenderer}
		/>
	);
});
TagsSelector.propTypes = {
	selectedTags: PropTypes.arrayOf(PropTypes.string),
	setSelectedTags: PropTypes.func
};

export default TagsSelector;
