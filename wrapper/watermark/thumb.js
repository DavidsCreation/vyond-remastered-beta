const fs = require("fs");

module.exports = function (_req, res, url) {
	const match = url.path.match(/\/watermarks\/([^/]+)$/);
	if (!match || match[1] == "list") return;
	res.end(fs.readFileSync(`./_WATERMARKS/${match[1]}`));
	return true;
}
