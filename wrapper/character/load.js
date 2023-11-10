const formidable = require("formidable");
const character = require('./main');

module.exports = function (req, res) {
	switch (req.method) {
		case "GET": {
			const match = req.url.match(/\/characters\/([^.]+)(?:\.xml)?$/);
			if (!match) return;

			var id = match[1];
			res.setHeader('Content-Type', 'text/xml');
			process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
			character.load(id).then(v => { res.statusCode = 200, res.end(v) })
				.catch(e => { res.statusCode = 404, res.end(e) })
			return true;
		}

		case "POST": {
			if (req.url != "/goapi/getCcCharCompositionXml/") return;
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				console.log("Loading character: " + f.assetId || f.original_asset_id)
				res.setHeader('Content-Type', 'text/html; charset=UTF-8');
				process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
				character.load(f.assetId || f.original_asset_id).then(v => { res.statusCode = 200, res.end(0 + v) }).catch(e => { res.statusCode = 404, res.end(1 + e) });
			});
			return true;
		}
		default: return;
	}
}
