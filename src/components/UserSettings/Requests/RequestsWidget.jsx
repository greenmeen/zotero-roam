import React from "react";

import { Button, Dialog } from "@blueprintjs/core";
import DataRequest from "./DataRequest";
import RequestsEditor from "./RequestsEditor";
import { RowCol } from "../common";

import useBool from "../../../hooks/useBool";
import { useRequestsSettings } from "./index";

import { CustomClasses } from "../../../constants";


function RequestsWidget(){
	const [
		{
			/*apiKeys,*/
			dataRequests,
			/*libraries*/
		},
		setOpts
	] = useRequestsSettings();

	const [isDialogOpen, { on: openDialog, off: closeDialog }] = useBool(false);

	return <>
		<RowCol title="Data Requests" description="Choose which items to sync from Zotero" rightElement={<Button className={CustomClasses.TEXT_SMALL} icon={dataRequests.length == 0 ? "arrow-right" : null} intent="warning" minimal={true} onClick={openDialog} text={dataRequests.length == 0 ? "Add request" : "Edit"} />}>
			{dataRequests.map((req) => <DataRequest key={req.name} request={req} />)}
		</RowCol>
		<Dialog isOpen={isDialogOpen} onClose={closeDialog}>
			<RequestsEditor closeDialog={closeDialog} dataRequests={dataRequests} updateRequests={setOpts} />
		</Dialog>
	</>;
}

export default RequestsWidget;