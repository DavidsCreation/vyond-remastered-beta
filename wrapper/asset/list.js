const formidable = require("formidable");
const header = process.env.XML_HEADER;
const fUtil = require("../fileUtil");
const nodezip = require("../zip/main");
const base = Buffer.alloc(1, 0);
const asset = require("./main");
const https = require("https");
const fs = require("fs");
const session = require("../data/sessions");
function get(url) {
	return new Promise((res, rej) => {
		https.get(url, r => {
			const buffers = [];
			r.on("data", b => buffers.push(b)).on("end", () => res(Buffer.concat(buffers))).on("error", rej);
		}).on("error", rej);
	})
}
function getFontThumbFileName(id) {
	fs.readdirSync(`./_ASSETS/img`).forEach(file => {
		if (file.endsWith(`_${id}.png`)) return file;
	})
}
async function listAssets(f, data, makeZip, makeJson, getDiscordAssets) {
	var xmlString = header, files, files2;
	if (!getDiscordAssets) switch (data.type) {
		case "font": {
			xmlString = {
				status: "ok",
				result: []
			}
			for (const v of asset.list("font")) {
				xmlString.result.unshift({
					id: v.id,
					tags: v.tags,
					published: v.published,
					title: v.title,
					enc_asset_id: v.enc_asset_id,
					trayImage: `/assets/${v.id.split(".zip")[0]}/img/${getFontThumbFileName(v.id.split(".zip")[0])}`
				})
			}
		}
		case "char": {
			let tId;
			switch (data.themeId) {
				case "custom": {
					tId = "family";
					break;
				} 
				case "animal":
				case "action": {
					tId = "cc2";
					break;
				} default: {
					tId = data.themeId;
					break;
				}
			}
			files = asset.list("char", 0, tId);
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<char id="${v.id}" enc_asset_id="${v.id}" name="${v.title}" cc_theme_id="${v.themeId}" thumbnail_url="/assets/${v.id}.png" copyable="Y"><tags>${v.tags}</tags></char>`
				)
				.join("")}</ugc>`;
			break;
		} case "bg": {
			files = asset.list("bg");
			xmlString = `${header}<ugc more="0">${files
				.map((v) => `<background subtype="0" enc_asset_id="${v.id}" id="${v.file}" name="${v.title}" enable="Y" asset_url="/assets/${v.file}"/>`)
				.join("")}</ugc>`;
			break;
		} case "sound": {
			files = asset.list("sound");
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<sound subtype="${v.subtype}" id="${v.file}" enc_asset_id="${v.id}" name="${v.title}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`
				)
				.join("")}</ugc>`;
			break;
		} case "movie": {
			files = asset.list("movie");
			xmlString = `${header}<ugc more="0">${files
				.map(
					(v) =>
						`<movie id="${v.id}" enc_asset_id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${v.title}" thumbnail_url="/assets/${v.id}.png"><tags>${v.tags}</tags></movie>`
				)
				.join("")}</ugc>`;
			break;
		} default: {
			xmlString += `<ugc more="0">`;
			if (data.type == "prop" && data.subtype != "video" && !data.folder) {
				files = asset.list("prop");
				files2 = asset.listFolders();
				for (const v of files) xmlString += `<prop subtype="0" enc_asset_id="${v.id}" id="${v.file}" name="${v.title}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" asset_url="/assets/${v.file}"/>`
				if (makeJson && !f.flashvars.bgload.endsWith("/go_full_late_2015.swf")) for (const v of files2) {
					const count = asset.getFileCount(v.id);
					xmlString += `<folder id="${v.id}" name="${v.name || v.title}" createdDate="${count}"/>`;
				}
			} else if (data.folder) {
				files = asset.listInFolder(data.folder);
				let page = 1;
				let count = 0;
				for (const v of files) {
					if (count == `${page}0`) page++
					xmlString += `<prop folder="${data.folder}" page="${page}" enc_asset_id="${v.id}" id="${v.file}" name="${v.title}" enable="Y" placeable="1" facing="left" width="0" height="0" asset_url="/folders/${data.folder}/${v.file}"/>`
					count++
				}
			} else files = [];
			xmlString += '</ugc>';
			console.log(xmlString);
			break;
		}
	} else await new Promise((res, rej) => {
		https.get({
			hostname: "discord.com",
			path: "/api/v10/channels/817043730325700678/messages?limit=100",
			headers: {
				Authorization: 'Nzc1NTA4NTM1NTY3NTgxMTk1.GLXuD0.V-h01dDdHzPX3qzoeyl770UQFVM0xf_RUkHTmU'
			}
		}, r => {
			const buffers = [];
			r.on("data", b => buffers.push(b)).on("end", () => {
				xmlString += `<ugc more="0">`;
				for (const json of JSON.parse(Buffer.concat(buffers))) {
					for (const info of json.attachments) {
						if (info.filename) switch (data.type) {
							case "prop": {
								if (data.subtype == "video") {

								} else if (
									info.content_type.endsWith("png")
								) xmlString += `<prop subtype="0" enc_asset_id="${info.id}" id="${info.id}" name="${
									info.filename
								}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" asset_url="/serveDiscordAsset?id=${info.id}&type=${info.content_type}&filename=${info.filename}&channelId=817043730325700678"/>`
								break;
							} case "bg": {
								if (
									info.content_type.endsWith("jpeg")
								) xmlString += `<background subtype="0" enc_asset_id="${info.id}" id="${info.id}" name="${
									info.filename
								}" enable="Y" asset_url="/serveDiscordAsset?id=${info.id}&type=${info.content_type}&filename=${
									info.filename
								}&channelId=817043730325700678"/>`
								break;
							}
						}
					}
				}
				xmlString += '</ugc>';
				res();
			});
		})
	});
	if (makeZip) {
		const zip = nodezip.create();
		fUtil.addToZip(zip, "desc.xml", Buffer.from(xmlString));

		for (const file of files) {
			const buffer = asset.load(file.file);
			fUtil.addToZip(zip, `${file.type}/${file.file}`, buffer);
		}
		return await zip.zip();
	} else if (!makeJson) return xmlString;
	else {
		return {
			status: "ok",
			data: {
				xml: xmlString
			}
		}
	};
}
/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	var makeZip = false, makeJson = false, commZip = false, searchCommAssets = false, getDiscordAssets = false, getDiscordSharedAssets = false;
	switch (url.pathname) {
		case "/goapi/getUserAssets/": {
			makeZip = true;
			break;
		}
		case "/goapi/searchCommunityAssets/": searchCommAssets = true;
		case "/goapi/getCommunityAssets/": {
			commZip = true;
			break;
		}
		case "/api_v2/assets/shared": getDiscordSharedAssets = true;
		case "/api_v2/assets/team": getDiscordAssets = true;
		case "/api_v2/assets/imported": {
			makeJson = true;
			break;
		}
		case "/goapi/getUserAssetsXml/": break;
		default: return;
	}

	switch (req.method) {
		case "GET": {
			var q = url.query;
			if (q.type) {
				listAssets(q, makeZip).then((buff) => {
					const type = makeZip ? "application/zip" : !makeJson ? "application/xml" : "application/json";
					res.setHeader("Content-Type", type);
					res.end(!makeJson ? buff : JSON.stringify(buff));
				});
				return true;
			} else return;
		}
		case "POST": {
			new formidable.IncomingForm().parse(req, async (e, f, files) => {
				if (getDiscordSharedAssets && getDiscordAssets) {
					https.get({
						hostname: "discord.com",
						path: "/api/v10/channels/942904763413069914/messages?limit=100",
						headers: {
							Authorization: 'Nzc1NTA4NTM1NTY3NTgxMTk1.GLXuD0.V-h01dDdHzPX3qzoeyl770UQFVM0xf_RUkHTmU'
						}
					}, r => {
						const buffers = [];
						r.on("data", b => buffers.push(b)).on("end", () => {
							const data = f.data || f;
							let xml = `${header}<ugc more="0">`;
							for (const json of JSON.parse(Buffer.concat(buffers))) {
								for (const info of json.attachments) {
									if (info.filename) switch (data.type) {
										case "prop": {
											if (data.subtype == "video") {
			
											} else if (
												info.content_type.endsWith("png")
											) xml += `<prop subtype="0" enc_asset_id="${info.id}" id="${info.id}" name="${
												info.filename
											}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" asset_url="/serveDiscordAsset?id=${info.id}&type=${info.content_type}&filename=${info.filename}&channelId=942904763413069914"/>`
											break;
										} case "bg": {
											if (
												info.content_type.endsWith("jpeg")
											) xml += `<background subtype="0" enc_asset_id="${info.id}" id="${info.id}" name="${
												info.filename
											}" enable="Y" asset_url="/serveDiscordAsset?id=${info.id}&type=${info.content_type}&filename=${
												info.filename
											}&channelId=942904763413069914"/>`
											break;
										}
									}
								}
							}
							xml += '</ugc>';
							const stuff = makeJson ? JSON.stringify({
								status: "ok",
								data: {
									xml
								}
							}) : xml;
							const type = !makeJson ? "application/xml" : "application/json";
							console.log(stuff, type);
							res.setHeader("Content-Type", type);
							if (makeJson) console.log(f);
							res.end(stuff);
						});
					})
				} else if (commZip) {
					https.get(`https://serpapi.com/searches/f3e0f3db10568059/6532eb7ef55d771333bf1d17.json`, r => {
						const buffers = [];
						r.on("data", b => buffers.push(b)).on("end", async () => {
							let xml = '', assets = 0;
							const zip = nodezip.create();
							const json = JSON.parse(Buffer.concat(buffers));
							switch (f.type) {
								case "bg": {
									for (const info of json.images_results) {
										if (searchCommAssets && f.keywords && info.title.includes(f.keywords)) {
											assets++
											const id = info.related_content_id;
											xml += `<background id="${id}.jpeg" enc_asset_id="${id}.jpeg" name="${
												info.title
											}" published="1"><tags></tags></background>`
											fUtil.addToZip(zip, `bg/${id}.jpeg`, await get(info.thumbnail));
										} else {
											const id = info.related_content_id
											xml += `<background id="${id}.jpeg" enc_asset_id="${id}.jpeg" name="${
												info.title
											}" published="1"><tags></tags></background>`
											fUtil.addToZip(zip, `bg/${id}.jpeg`, await get(info.thumbnail));
										}
									}
									break;
								} case "prop": {
									for (const info of json.suggested_searches) if (info.thumbnail) {
										if (searchCommAssets && f.keywords && info.name.includes(f.keywords)) {
											assets++
											const id = info.chips.toString("base64");
											xml += `<prop id="${id}.png" enc_asset_id="${id}.png" name="${
												info.name
											}" holdable="0" wearable="0" placeable="1" published="1" facing="left" subtype="0"><tags></tags></prop>`
											fUtil.addToZip(zip, `prop/${id}.png`, await get(info.thumbnail));
										} else {
											const id = info.chips.toString("base64");
											xml += `<prop id="${id}.png" enc_asset_id="${id}.png" name="${
												info.name
											}" holdable="0" wearable="0" placeable="1" published="1" facing="left" subtype="0"><tags></tags></prop>`
											fUtil.addToZip(zip, `prop/${id}.png`, await get(info.thumbnail));
										}
									}
									break;
								}
							}
							fUtil.addToZip(zip, 'desc.xml', `<theme id="ugc" name="Community Library" all_asset_count="${assets}">${xml}</theme>`);
							res.setHeader("Content-Type", "application/zip");
							res.end(Buffer.concat([base, await zip.zip()]));
						})
					})
				} else {
					const buff = await listAssets(session.get(req), f.data || f, makeZip, makeJson, getDiscordAssets);
					const stuff = makeJson ? JSON.stringify(buff) : buff;
					const type = makeZip ? "application/zip" : !makeJson ? "application/xml" : "application/json";
					console.log(buff, type);
					res.setHeader("Content-Type", type);
					if (makeZip) return res.end(Buffer.concat([base, stuff]));
					if (makeJson) console.log(f);
					res.end(stuff);
				}
			});
			return true;
		}
		default:
			return;
	}
};
