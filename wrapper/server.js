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
const { BrowserWindow, Menu } = require("electron");
// this is supposed to run on linux. but no, it's using windows.

/**
 * routes
 */
const asd = require("./asset/delete");
const fdr = require("./asset/folder");
const ass = require("./asset/static");
const asa = require("./asset/save");
const asl = require("./asset/load");
const asL = require("./asset/list");
const asm = require("./asset/meta");
const ast = require("./asset/thmb");
const asT = require("./asset/thumb");
const chr = require("./character/redirect");
const pmc = require("./character/premade");
const chl = require("./character/load");
const chs = require("./character/save");
const chu = require("./character/upload");
const dbs = require("./data/settings");
const sts = require("./starter/save");
const Stl = require("./static/load");
const Stp = require("./static/page");
const mvl = require("./movie/load");
const mvr = require("./movie/redirect");
const mvL = require("./movie/list");
const mvm = require("./movie/meta");
const mvs = require("./movie/save");
const mvt = require("./movie/thmb");
const mvu = require("./movie/delete");
const thl = require("./theme/load");
const thL = require("./theme/list");
const tsv = require("./tts/voices");
const tsl = require("./tts/load");
const waa = require("./watermark/assign");
const WaL = require("./watermark/thumb");
const Waa = require("./watermark/delete");
const wal = require("./watermark/list");
const wAl = require("./waveform/load");
const wAs = require("./waveform/save");

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
		console.log(req.method, parsedUrl.path, '-', res.statusCode);
		if (!found) { // page not found
			res.statusCode = 404;
		}
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
