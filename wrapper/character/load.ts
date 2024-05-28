const formidable = require("formidable");
const character = require('./main.ts');
const nodezip = require("../zip/main.ts");
const fs = require("fs");
const fUtil = require("../fileUtil.ts");
module.exports = function (req, res, url) {
	switch (req.method) {
		case "GET": {
			const match = req.url.match(/\/characters\/([^.]+)(?:\.xml)?$/);
			if (!match) return;

			var id = match[1];
			res.setHeader('Content-Type', 'text/xml');
			process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
			character.load(id).then(v => { res.statusCode = 200, res.end(v) }).catch(e => { res.statusCode = 404, res.end(e) })
			break;
		} case "POST": {
			switch (url.pathname) {
				case "/goapi/getCcCharCompositionXml/": {
					new formidable.IncomingForm().parse(req, async (e, f, files) => {
						console.log("Loading character: " + f.assetId || f.original_asset_id)
						res.setHeader('Content-Type', 'text/html; charset=UTF-8');
						process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
						character.load(f.assetId || f.original_asset_id).then(v => { res.statusCode = 200, res.end(0 + v) }).catch(e => { res.statusCode = 404, res.end(1 + e) });
					});
					break;
				} case "/goapi/getCharacter/": {
					new formidable.IncomingForm().parse(req, async (e, f, files) => { // we are using the community library theme in this case.
						const zip = nodezip.create();
						for (const ci of fs.readdirSync(`./server/store/3a981f5cb2739137/Comm/char/${f.assetId}`)) {
							if (fs.lstatSync(`./server/store/3a981f5cb2739137/Comm/char/${f.assetId}/${ci}`).isDirectory()) for (
								const si of fs.readdirSync(`./server/store/3a981f5cb2739137/Comm/char/${f.assetId}/${ci}`)
							) fUtil.addToZip(zip, `char/${f.assetId}/${ci}/${si}`, fs.readFileSync(`./server/store/3a981f5cb2739137/Comm/char/${f.assetId}/${ci}/${si}`))
							else fUtil.addToZip(zip, `char/${f.assetId}/${ci}`, fs.readFileSync(`./server/store/3a981f5cb2739137/Comm/char/${f.assetId}/${ci}`))
						}
						res.end(await zip.zip());
					});
					break;
				} default: return;
			}
			break;
		}
		default: return;
	}
	return true;
}
