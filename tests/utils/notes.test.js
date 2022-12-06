import { formatItemNotes, formatZoteroNotes, simplifyZoteroNotes } from "../../src/utils";
import { libraries } from "Mocks/zotero/libraries";
import { sampleNote } from "Mocks/zotero/notes";


const { userLibrary } = libraries;

test("Simplifies notes", () => {
	expect(simplifyZoteroNotes([sampleNote]))
		.toEqual([
			{
				date_added: sampleNote.data.dateAdded,
				date_modified: sampleNote.data.dateModified,
				key: sampleNote.key,
				location: userLibrary.path,
				link_note: "zotero://select/library/items/" + sampleNote.key,
				note: sampleNote.data.note,
				parent_item: sampleNote.data.parentItem,
				raw: sampleNote,
				tags: ["toRead"]
			}
		]);
});

describe("Parsing HTML notes", () => {
	const notes = [
		{ data: { note: "<h1>Note Title</h1><div class=\"div-class\"><span>Lorem ipsum</span></div>" } },
		{ data: { note: "Click <a href=\"https://example.com\">here</a> to open a link" } },
		{ data: { note: "See <a class=\"link-class\" href=\"https://example.com\">there</a> for a link with attributes" } },
		{ data: { note: "\n\nSome text\n" } },
		{ data: { note: "<ul><li>Some element</li></ul>\n\n<div>A paragraph</div>" } },
		{ data: { note: "<p>Some text</p>\n<ul>\n<li>\nSome element\n</li>\n<li>\nAnother element\n</li>\n<li>\nA third element\n</li>\n</ul>\n<p>Some content</p>\n" } }
	];	

	it("cleans markup from rich tags", () => {
		expect(formatZoteroNotes([notes[0]]))
			.toEqual(["**Note Title**Lorem ipsum"]);
	});
	
	it("formats links into Markdown", () => {
		expect(formatItemNotes([notes[1], notes[2]], "</p>"))
			.toEqual([
				"Click [here](https://example.com) to open a link",
				"See [there](https://example.com) for a link with attributes"
			]);
	});
	
	it("removes newlines", () => {
		expect(formatItemNotes([notes[3]], "</p>"))
			.toEqual([
				"Some text"
			]);
		expect(formatItemNotes([notes[4]], "</p>"))
			.toEqual([
				"Some element\nA paragraph"
			]);
	});

	it("cleans list markup", () => {
		expect(formatZoteroNotes([notes[5]]))
			.toEqual([
				"Some text",
				"Some element",
				"Another element",
				"A third element",
				"Some content"
			]);
		expect(formatItemNotes([notes[5]], "</p>"))
			.toEqual([
				"Some text",
				"Some element\nAnother element\nA third element\nSome content"
			]);
	});
});