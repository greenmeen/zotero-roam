/* istanbul ignore file */

/** 
 * @typedef {{
 * apikey: String,
 * path: String
 * }}
 * ZoteroLibrary
 */

/**
 * @typedef {{
 * access: Object,
 * key: String,
 * userID: Integer,
 * username: String
 * }}
 * ZoteroKey
 */

/**
 * @typedef {{
 * data: Object,
 * has_citekey?: Boolean,
 * key: String,
 * library: Object,
 * links: Object,
 * meta: Object,
 * version: Integer
 * }} 
 * ZoteroItem
 */

/**
 * @typedef {{
 * data: Object,
 * key: String,
 * library: Object,
 * links: Object,
 * meta: Object,
 * version: Integer
 * }}
 * ZoteroCollection
 */

/**
 * @typedef {{
 * links: Object,
 * meta: {numItems: Integer, type: Integer},
 * tag: String
 * }}
 * ZoteroTag
 */

/**
 * @typedef {{
 * data: { annotationColor: String, annotationComment: String, annotationPageLabel: String, annotationPosition: String, annotationSortIndex: String, annotationText: String, annotationType: ("highlight"|"image"), dateAdded: String, dateModified: String, itemType: ("annotation"), key: String, parentItem: String, relations: Object, tags: Object[], version: Integer },
 * key: String,
 * library: Object,
 * links: Object,
 * meta: Object,
 * version: Integer
 * }}
 * ZoteroAnnotation
 */

/**
 * @typedef {{
 * include: String,
 * linkwrap: Boolean,
 * locale: String,
 * style: String
 * }}
 * ConfigBibliography
 */

/**
 * @typedef {{
 * apikey?: String,
 * dataURI: String,
 * library?: { id: String, path: String, type: ("groups"|"users"), uri: String },
 * name?: String,
 * params?: String
 * }}
 * DataRequest
 */

/**
 * @typedef {{
 * dataRequests: DataRequest[],
 * apiKeys: String[],
 * libraries: ZoteroLibrary[]
 * }}
 * ConfigRequests
 */

/**
 * @typedef {{
 * func: String,
 * group_by: ("day_added"|false),
 * template_comment: String,
 * template_highlight: String,
 * use: ("default"|"function"),
 * __with: ("formatted"|"raw")
 * }}
 * SettingsAnnotations
 */

/**
 * @typedef {("citekey"|"key"|"inline"|"tag"|"pageref"|"citation"|"popover"|"zettlr")} AutocompleteItemFormat
 */
/**
 * @typedef {{
 * trigger: String,
 * display_char: String,
 * display_use: ("preset"|"custom"),
 * display: AutocompleteItemFormat,
 * format_char: String,
 * format_use: ("preset"|"custom"),
 * format: AutocompleteItemFormat
 * }}
 * SettingsAutocomplete
 */

/**
 * @typedef {{
 * always: Boolean,
 * overrideKey: ("altKey"|"ctrlKey"|"metaKey"|"shiftKey"),
 * preset: ("citation"|"citekey"|"page-reference"|"raw"|"tag"),
 * template: String,
 * useAsDefault: ("preset"|"template"),
 * useQuickCopy: Boolean
 * }}
 * SettingsCopy
 */

/**
 * @typedef {{
 * func: String,
 * smartblock: {SmartblockConfig},
 * use: ("default"|"function"|"smartblock")
 * }}
 * SettingsMetadata
 */

/**
 * @typedef {{
 * func: String,
 * nest_char: String,
 * nest_position: ("top"|"bottom"),
 * nest_preset: (false|"[[Notes]]"),
 * nest_use: ("preset"|"custom"),
 * split_char: String,
 * split_preset: ("\n"|"</p>"),
 * split_use: ("preset"|"custom")
 * use: ("default"|"function")
 * __with: ("raw"|"text")
 * }}
 * SettingsNotes
 */

/**
 * @typedef {Object.<string, string>}
 * SettingsTypemap
 */


// ---------------------------------------

/**
 * @typedef {{
 * param: ("srcName"|"srcUid"),
 * paramValue: String
 * }}
 * SmartblockConfig
 */

/**
 * @typedef {{
 * help: String,
 * handler: Function
 * }}
 * SmartblockCommand
 */

// ---------------------------------------

/**
 * @typedef {{
 * children?: (String|RoamImportableBlock)[],
 * order?: Integer,
 * parentUID?: String,
 * string: String,
 * text: String,
 * }}
 * RoamImportableBlock
 */