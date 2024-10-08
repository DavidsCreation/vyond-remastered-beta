/* Looking for a written form of the themes list?
"action"
"akon"
"animal"
"anime"
"ben10"
"botdf"
"bunny"
"cc_store"
"chibi"
"chowder"
"christmas"
"common"
"custom"
"domo"
"fullenergy"
"monkeytalk"
"monstermsh"
"ninja"
"ninjaanime"
"politic"
"politics2"
"retro"
"sf"
"space"
"spacecitizen"
"startrek"
"stick"
"sticklybiz"
"street"
"underdog"
"vietnam"
"willie"
*/

const fUtil = require('../fileUtil.ts');
const folder = process.env.THEME_FOLDER;
const database = require("../data/database.ts"), DB = new database(true);
module.exports = function (req, res, url) {
	if (req.method != 'POST' || url.path != '/goapi/getThemeList/') return;
	const db = DB.get();
	res.setHeader('Content-Type', 'application/zip');
	if (db.year == "2016") fUtil.zippy(`${folder}/themelist.xml`, 'themelist.xml').then(b => res.end(b));
	else fUtil.zippy(`${folder}/themelist_2015.xml`, 'themelist.xml').then(b => res.end(b));
	return true;
}