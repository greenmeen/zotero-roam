import React from "react";
import { number, shape } from "prop-types";
import { ProgressBar } from "@blueprintjs/core";

const Stats = React.memo(function Stats({ stats }){
	if(!stats){
		return null;
	} else {
		const { nTags, nRoam, nAuto, nTotal} = stats;
		const autoPct = Math.round(nAuto/nTags*100)/100;
		const roamPct = Math.round(nRoam/nTotal*100)/100;
		
		return (
			<div className={["zr-auxiliary", "zr-text-small"].join(" ")} zr-role="list-stats" >
				<span zr-role="stats-text">
					Zotero has {nTags} tags, matched in {nTotal} groups
				</span>
				<span zr-role="stats-figures">
					<span zr-role="stats-bar" >
						Automatic : {autoPct*100}%
						<ProgressBar animate={false} intent="warning" stripes={false} value={autoPct} />
					</span>
					<span zr-role="stats-bar" >
						In Roam : {roamPct*100}%
						<ProgressBar animate={false} intent="primary" stripes={false} value={roamPct} />
					</span>
				</span>
			</div>
		);
	}
});
Stats.propTypes = {
	stats: shape({
		nAuto: number,
		nRoam: number,
		nTags: number,
		nTotal: number
	})
};

export default Stats;
