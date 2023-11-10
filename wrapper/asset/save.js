/***
 * asset upload route
 */
const formidable = require("formidable");
const fileTypes = require("./info.json");
const fUtil = require("../fileUtil");
const fs = require("fs");
const mp3Duration = require("mp3-duration");
const asset = require("./main");
const wm = require("../watermark/main");
const database = require("../data/database"), DB = new database();

module.exports = function (req, res, url) {
	if (req.method != "POST") return;
	switch (url.path) {
		case "/ajax/saveUserProp": { // asset uploading (legacy)
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				try {
					if (e) res.end(JSON.stringify({suc: false, msg: e}));
					else if (!files) {
						res.end(JSON.stringify({
							suc: false,
							msg: "Please choose a file to upload"
						}));
					} else if (!f || !f.subtype) {
						res.end(JSON.stringify({
							suc: false,
							msg: "File upload failed. Missing one or more fields."
						}));
					} else {
						const db = DB.get();
						const id = fUtil.generateId();
						const type = f.subtype == "soundeffect" ||
						f.subtype == "voiceover" || f.subtype == "bgmusic" ? "sound" : f.subtype;
						const file = files.file || files.import;
						const path = file.path || file.filepath;
						const name = file.name || file.originalFilename;
						const dot = name.lastIndexOf(".");
						const ext = name.substr(dot + 1);
						const newName = `${id}.${ext}`;
						const buffer = fs.readFileSync(path);
						const folder = process.env.ASSET_FOLDER;
						fs.writeFileSync(`${folder}/${newName}`, buffer);  
						const info = {
							suc: true,
							// gives meta for the importer js file to read
							id: newName,
							asset_type: type,
							filename: name,
							asset_data: {
								id,
								enc_asset_id: id,
								themeId: "ugc",
								type,
								subtype: type != "sound" ? 0 : f.subtype,
								title: name,
								published: "",
								share: {
									type: "none"
								},
								tags: "",
								file: newName
							}
						}
						switch (type) {
							case "prop": {
								info.thumbnail = `/assets/${newName}`;
								info.asset_data.ptype = "placeable";
								break;
							} case "font": {
								info.thumbnail = `/assets/${newName}.swf`;
								info.asset_data.ptype = "0";
								break;
							} case "sound": {
								await new Promise((resolve, rej) => {
									mp3Duration(buffer, (e, d) => {
										info.asset_data.duration = 1e3 * d;
										info.asset_data.downloadtype = "progressive";
										resolve();
									});
								})
								break;
							} default: {
								info.thumbnail = `/assets/${newName}`;
								break;
							} 
						}
						db.assets.unshift(info.asset_data);
						DB.save(db);
						res.end(JSON.stringify(info));
						fs.unlinkSync(path);
					}
				} catch (e) {
					console.log(e);
					res.end(JSON.stringify({
						suc: false, 
						msg: "File Upload Failed. Please check your command prompt for more details."
					}));
				}
			});
			return true;
		}
		case "/api/asset/upload": { // asset uploading
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				const path = files.import.path || files.import.filepath, buffer = fs.readFileSync(path);
				let type = f.type, subtype;
				if (f.type == "soundeffect" || f.type == "voiceover" || f.type == "bgmusic") type = "sound";
				subtype = f.subtype || f.type;
				const name = files.import.name || files.import.originalFilename;
				const ext = name.substring(name.lastIndexOf(".") + 1);
				let meta;
				switch (type) {
					case "sound": {
						if (f.redirect && !fileTypes.sound[ext]) {
							res.statusCode = 302;
							res.setHeader("Location", `/error?err=File Type (${ext}) is not supported for sound importing. please pick a different file type in order to do sound importing.`);
							res.end();
							return;
						}
						await new Promise((resolve, rej) => {
							mp3Duration(buffer, (e, duration) => {
								if (e || !duration) return;
								meta = {
									type: "sound",
									subtype,
									title: name.substring(0, name.lastIndexOf(".")),
									duration: 1e3 * duration,
									ext: ext,
									tId: "ugc",
									downloadtype: "progressive"
								};
								asset.save(buffer, meta);
								resolve();
							});
						});
						break;
						
					} case "watermark": { 
						if (!fileTypes.watermark[ext]) { // ico or svg is not supported and will never be.
							res.statusCode = 302;
							res.setHeader("Location", `/error?err=File Type (${ext}) is not supported. even if we supported that type, it would not work correctly on the actual lvm.`);
							res.end();
						} else {
							try { 
								wm.save(buffer, ext);
							} catch (e) { 
								console.log(e); 
							}
							res.statusCode = 302;
							res.setHeader("Location", "/");
							res.end();
						}
						break;
					} case "prop": {
						if (f.redirect && !fileTypes.prop[ext]) {
							if (fileTypes.video[ext]) {
								res.statusCode = 302;
								res.setHeader("Location", `/error?err=Video importing won't be added because it tends to be dodgy and it's hard to work on according to David's Creation. please import something else.`);
								res.end();
							} else {
								res.statusCode = 302;
								res.setHeader("Location", `/error?err=File Type (${ext}) is not supported for prop importing. please pick a different file type in order to do prop importing.`);
								res.end();
							}
							return;
						}
						meta = {
							type: "prop",
							subtype: 0,
							title: name.substring(0, name.lastIndexOf(".")),
							ext: ext,
							ptype: "placeable",
							tId: "ugc"
						}
						asset.save(buffer, meta);
						break;
					} case "font": {
						const elements = xml.children;
						var element = elements[eK];
						var piece = element.children[pK];
						const bubble = piece.childNamed('bubble');
						const text = bubble.childNamed('text');
						const font = `${name2Font(text.attr.font)}.swf`;
						const source = path.join(__dirname, "../../server", process.env.CLIENT_URL);
						const fontSrc = `${source}/assets/${font}`;
						fUtil.addToZip(zip, font, fs.readFileSync(fontSrc));
						if (f.redirect && !fileTypes.prop[ext]) {
							if (fileTypes.video[ext]) {
								res.statusCode = 302;
								res.setHeader("Location", `/error?err=Whut duh HAILLLLLLLLLLLLLL oh mah gawd no WAYAYAYYYY`);
								res.end();
							} else {
								res.statusCode = 302;
								res.setHeader("Location", `/error?err=big balls, touching you at night`);
								res.end();
							}
							return;
						}
						meta = {
							type: "font",
							subtype: 0,
							title: name.substring(0, name.lastIndexOf(".")),
							ext: ext,
							tId: "ugc"
						}
						asset.save(buffer, meta);
						break;
					} case "bg": {
						if (f.redirect && !fileTypes.bg[ext]) {
							res.statusCode = 302;
							res.setHeader("Location", `/error?err=File Type (${ext}) is not supported for background importing. please pick a different file type in order to do background importing.`);
							res.end();
							return;
						}
						meta = {
							type: "bg",
							subtype: 0,
							title: name.substring(0, name.lastIndexOf(".")),
							ext: ext,
							tId: "ugc"
						}
						asset.save(buffer, meta);
						break;
					}
				}
				fs.unlinkSync(path);
				if (f.type != "watermark") {
					if (!f.redirect) res.end(JSON.stringify({status: "ok", data: meta}));
					else {
						res.statusCode = 302;
						res.setHeader("Location", "/");
						res.end();
					}
				}
			});
			return true;
		}
		default: return;
	}
}
