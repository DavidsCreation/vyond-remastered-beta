/***
 * start vyond remastered's server
 */
// assign config and env.json stuff to process.env
const fs = require("fs");
const {env} = process;
const http = require("http");
const url = require("url");
const exec = require('child_process').execFile;
const path = require("path");
const https = require("https");
// this is supposed to run on linux. but no, it's using windows.

/**
 * routes
 */
const asd = require("./asset/delete.ts");
const fdr = require("./asset/folder.ts");
const ass = require("./asset/static.ts");
const asa = require("./asset/save.ts");
const asl = require("./asset/load.ts");
const asL = require("./asset/list.ts");
const asm = require("./asset/meta.ts");
const ast = require("./asset/thmb.ts");
const asT = require("./asset/thumb.ts");
const chr = require("./character/redirect.ts");
const pmc = require("./character/premade.ts");
const chl = require("./character/load.ts");
const chs = require("./character/save.ts");
const chu = require("./character/upload.ts");
const dbs = require("./data/settings.ts");
const sts = require("./starter/save.ts");
const Stl = require("./static/load.ts");
const Stp = require("./static/page.ts");
const mvl = require("./movie/load.ts");
const mvr = require("./movie/redirect.ts");
const mvL = require("./movie/list.ts");
const mvm = require("./movie/meta.ts");
const mvs = require("./movie/save.ts");
const mvt = require("./movie/thmb.ts");
const mvu = require("./movie/delete.ts");
const thl = require("./theme/load.ts");
const thL = require("./theme/list.ts");
const tsv = require("./tts/voices.ts");
const tsl = require("./tts/load.ts");
const waa = require("./watermark/assign.ts");
const WaL = require("./watermark/thumb.ts");
const Waa = require("./watermark/delete.ts");
const wal = require("./watermark/list.ts");
const wAl = require("./waveform/load.ts");
const wAs = require("./waveform/save.ts");

const functions = [asT, fdr, WaL, ass, asd, asa, asl, asL, mvr, asm, ast, chr, dbs, pmc, chl, chs, chu, sts, Stl, Stp, mvl, mvL, mvm, mvs, mvt, mvu, thl, thL, tsv, tsl, waa, Waa, wal, wAl, wAs];

/**
 * create the server
 */
http.createServer((req, res) => {
	const parsedUrl = url.parse(req.url, true);
	try {
		// run each route function until the correct one is found
		const found = functions.find((f) => f(req, res, parsedUrl));
		// log every request
		if (!found) switch (req.method) {
			case "GET": {
				switch (parsedUrl.pathname) {
					case "/serveDiscordAsset": {
						res.statusCode = 200;
						if (
							parsedUrl.query.id && parsedUrl.query.filename
						) https.get(`https://cdn.discordapp.com/attachments/${parsedUrl.query.channelId}/${parsedUrl.query.id}/${
							parsedUrl.query.filename
						}`, r => {
							const buffers = [];
							r.on("data", b => buffers.push(b)).on("end", () => {
								if (parsedUrl.query.type) res.setHeader("Content-Type", parsedUrl.query.type);
								res.end(Buffer.concat(buffers));
							})
						});
						break;
					} default: res.statusCode = 404;
				}
				break;
			} default: break;
		}
		console.log(req.method, parsedUrl.path, '-', res.statusCode);
	} catch (x) {
		res.statusCode = 500;
		res.end('<a href="/">Home</a><center>500 Server Error</center>');
		console.log(x);
		console.log(req.method, parsedUrl.path, '-', res.statusCode);
	}
}).listen(process.env.PORT || env.SERVER_PORT, () => {
	console.log("Vyond: Remastered has started.");
	if (process.env.OS_USED == "Windows") exec("launchBrowser.bat", {cwd: path.join(__dirname, "../")}, (_err, data) => console.log(data));
})

