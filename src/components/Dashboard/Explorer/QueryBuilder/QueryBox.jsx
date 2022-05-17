import React, { useCallback} from "react";
import { array, bool, func, shape } from "prop-types";
import { Button } from "@blueprintjs/core";

import QueryEntry from "./QueryEntry";
import { defaultQueryTerm } from "./queries";
import { removeArrayElemAt, returnSiblingArray, updateArrayElemAt } from "./utils";

function QueryBox({ handlers, isLastChild, isOnlyChild, terms = [], useOR = true }){
	const { removeSelf, updateSelf } = handlers;

	const addTerm = useCallback(() => {
		updateSelf(returnSiblingArray(terms, defaultQueryTerm));
	}, [terms, updateSelf]);

	const removeTerm = useCallback((index) => {
		updateSelf(removeArrayElemAt(terms, index));
	}, [terms, updateSelf]);

	const updateTerm = useCallback((index, value) => {
		updateSelf(updateArrayElemAt(terms, index, value));
	}, [terms, updateSelf]);

	const makeHandlersForChild = useCallback((index) => {
		return {
			removeSelf: () => removeTerm(index),
			updateSelf: (value) => updateTerm(index, value)
		};
	}, [removeTerm, updateTerm]);

	return <div className="zr-query-box">
		<div>
			{terms.map((tm, index) => {
				let termProps = {
					handlers: makeHandlersForChild(index),
					isLastChild: index == terms.length - 1,
					isOnlyChild: terms.length == 1,
					terms: tm,
					useOR: !useOR
				};

				return <>
					{index > 0 && <span zr-role="query-entry-operator">{useOR ? "AND" : "OR"}</span>}
					{tm.constructor === Array
						? <QueryBox key={index} {...termProps} />
						: <QueryEntry key={index} {...termProps} />}
				</>;

			})}
			{isLastChild
				? <Button className={["zr-query-box--add-sibling", "zr-text-small"].join(" ")} minimal={true} onClick={addTerm} rightIcon="small-plus" small={true} text={(useOR ? "OR" : "AND")} />
				: null}
		</div>
		{!isOnlyChild && <Button className="zr-query-box--remove-self" icon="cross" minimal={true} onClick={removeSelf} />}
	</div>;
}
QueryBox.propTypes = {
	handlers: shape({
		removeSelf: func,
		updateSelf: func
	}),
	isLastChild: bool,
	isOnlyChild: bool,
	terms: array,
	useOR: bool
};

export default QueryBox;
