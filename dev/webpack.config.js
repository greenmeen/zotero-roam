const path = require("path");

module.exports = {
	context: path.resolve(__dirname, '../'),
	devtool: "source-map",
	entry: path.resolve("src", "index.tsx"),
	output: {
		path: path.resolve("dist"),
		filename: "zoteroRoam.min.js",
		sourceMapFilename: "zoteroRoam.min.js.map"
	},
	resolve: {
        alias: {
            "Mocks": path.resolve("mocks"),
            "Roam": path.resolve("src", "roam.ts"),
			"Components": path.resolve("src", "components"),
			"Styles": path.resolve("styles"),
			"Types": path.resolve("src", "types")
        },
		extensions: [".js", ".jsx", ".ts", ".tsx", ".css", ".scss", ".sass"]
	},
	mode: "production",
	module: {
		rules: [
			{
				test: /\.[tj]sx?$/,
				include: path.resolve("src"),
				use: "swc-loader"
			},
			{
				test: /\.(sa|sc|c)ss$/i,
				use: ["style-loader", "css-loader", "sass-loader"],
			}
		]
    },
    performance: {
        maxAssetSize: 2000000,
        maxEntrypointSize: 2000000,
    }
};