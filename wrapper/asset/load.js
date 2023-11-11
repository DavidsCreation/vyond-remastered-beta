/***
 * asset load route
 */
const formidable = require("formidable");
const fs = require("fs");

module.exports = function (req, res, url) {
	if (req.method != "POST" || url.path != "/goapi/getAsset/") return;
	new formidable.IncomingForm().parse(req, async (e, f, files) => {
		const aId = f.assetId; 
		res.end(fs.readFileSync(`./_ASSETS/${aId}`));
	});
	return true;
}
