import { zotero } from "./common";
import { rest } from "msw";
import { data as libraries } from "./libraries";

const { userLibrary, groupLibrary } = libraries;

const addCollectionInfo = ({ key, library, name, version, hasParent = false, hasChildren = 0 } = {}) => {
	const { id, links, name: libName, path, type } = library;
	return {
		data: {
			key,
			name,
			parentCollection: hasParent,
			relations: {},
			version
		},
		key,
		library: {
			id,
			links,
			name: libName,
			type
		},
		links: {
			self: {
				href: `https://api.zotero.org/${path}/collections/${key}`,
				type: "application/json"
			},
			alternate: {
				href: `https://www.zotero.org/${type == "user" ? libName : path}/collections/${key}`,
				type: "text/html"
			}
		},
		meta: {
			numCollections: hasChildren,
			numItems: 1
		},
		version
	};
};

export const data = [
	{
		...addCollectionInfo({
			key: "ABCDEF",
			library: userLibrary,
			name: "Important items",
			version: 31
		})
	},
	{
		...addCollectionInfo({
			key: "PQRST",
			library: groupLibrary,
			name: "Reading List",
			version: 14
		})
	}
];

export const findCollections = (type, id) => {
	return data.filter(cl => cl.library.type + "s" == type && cl.library.id == id);
};

export const handleCollections = [
	rest.get(
		zotero(":libraryType/:libraryID/collections"),
		(req, res, ctx) => {
			const { libraryType, libraryID } = req.params;

			const { id, type, version } = Object.values(libraries).find(lib => lib.path == `${libraryType}/${libraryID}`);
			const collections = findCollections(type, id);

			return res(
				ctx.set("last-modified-version", `${version}`),
				ctx.set("total-results", Math.min(collections.length, 100)), // We're not mocking with additional requests
				ctx.json(collections)
			);
		}
	)
];