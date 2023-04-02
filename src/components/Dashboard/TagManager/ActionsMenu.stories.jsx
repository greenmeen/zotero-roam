import { useEffect } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { expect, jest } from "@storybook/jest";
import { userEvent, waitFor, within } from "@storybook/testing-library";

import ActionsMenu from "./ActionsMenu";

import { apiKeys } from "Mocks/zotero/keys";
import { libraries } from "Mocks/zotero/libraries";


const { keyWithFullAccess: { key: masterKey } } = apiKeys;
const { userLibrary } = libraries;

export default {
	component: ActionsMenu,
	args: {
		library: { apikey: masterKey, path: userLibrary.path }
	}
};

const Template = (args) => {
	const client = useQueryClient();

	useEffect(() => {
		client.setQueryData(["tags", { library: userLibrary.path }], {
			data: {},
			lastUpdated: userLibrary.version
		});

		return () => {
			client.clear();
		};
	}, [client]);

	return <ActionsMenu {...args} />;
};

export const Default = Template.bind({});
Default.args = {
	suggestion: {
		recommend: "history",
		type: "auto",
		use: {
			roam: ["history"],
			zotero: ["history", "HISTORY", "History"]
		}
	}
};
Default.play = async ({ canvasElement }) => {
	document.dispatchEvent = jest.fn();

	const canvas = within(canvasElement);
	await userEvent.click(canvas.getByText("Delete tag(s)"));

	await waitFor(() => expect(
		canvas.getByText(
			"Deleted"
		)
	).toBeInTheDocument(),
	{
		timeout: 3000
	});

	await expect(document.dispatchEvent).toHaveBeenCalled();
	await expect(document.dispatchEvent.mock.calls[0][0].detail)
		.toEqual(expect.objectContaining({
			data: expect.objectContaining({ status: 204 }),
			error: null,
			library: userLibrary.path,
			tags: ["history", "history", "HISTORY", "History"],
			_type: "tags-deleted"
		}));
};