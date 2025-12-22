const https = require("https");
const http = require("http");
const { Readable } = require("stream");
const qs = require("querystring");
const fs = require("fs");
const path = require("path");
const md5 = require("js-md5");
const ffmpeg = require("fluent-ffmpeg");

const info = require("./info.json");
const voices = info.voices;

const get = require("../request/get");
const fileUtil = require("../fileUtil");

ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);

module.exports = function tts(voiceName, text, headers) {
	return new Promise(async (resolve, reject) => {
		const voice = voices[voiceName];
		if (!voice) return reject("That voice doesn't seem to exist");

		try {
			switch (voice.source) {
				/* -------------------- VOCALWARE -------------------- */
				case "vocalware": {
					const [eid, lid, vid] = voice.arg;
					const cs = md5(`${eid}${lid}${vid}${text}1mp35883747uetivb9tb8108wfj`);

					const q = qs.encode({
						EID: eid,
						LID: lid,
						VID: vid,
						TXT: text,
						EXT: "mp3",
						IS_UTF8: 1,
						ACC: 5883747,
						cache_flag: 3,
						CS: cs,
					});

					https.get(
						{
							host: "cache-a.oddcast.com",
							path: `/tts/gen.php?${q}`,
							headers: {
								Referer: "https://www.oddcast.com/",
								Origin: "https://www.oddcast.com/",
								"User-Agent": headers["user-agent"],
							},
						},
						(r) => {
							const buffers = [];
							r.on("data", (d) => buffers.push(d));
							r.on("end", () => resolve(Buffer.concat(buffers)));
							r.on("error", reject);
						}
					);
					break;
				}

				/* -------------------- CEPSTRAL -------------------- */
				case "cepstral": {
					https.get("https://www.cepstral.com/en/demos", (r) => {
						const cookie = r.headers["set-cookie"];
						const q = qs.encode({
							voiceText: text,
							voice: voice.arg,
							createTime: 666,
							rate: 170,
							pitch: 1,
							sfx: "none",
						});

						const buffers = [];
						https.get(
							{
								host: "www.cepstral.com",
								path: `/demos/createAudio.php?${q}`,
								headers: { Cookie: cookie },
							},
							(r) => {
								r.on("data", (b) => buffers.push(b));
								r.on("end", async () => {
									const json = JSON.parse(Buffer.concat(buffers).toString());
									try {
										const data = await get(`https://www.cepstral.com${json.mp3_loc}`);
										resolve(data);
									} catch (e) {
										reject(e);
									}
								});
							}
						);
					});
					break;
				}

				/* -------------------- VOICEFORGE -------------------- */
				case "voiceforge": {
					const converted = await convertVoiceforgeText(text, voice.arg);

					const query = new URLSearchParams({
						msg: converted,
						voice: voice.arg,
						email: "chopped@chin.com",
					}).toString();

					const req = https.request(
						{
							hostname: "api.voiceforge.com",
							path: `/swift_engine?${query}`,
							method: "GET",
							headers: {
								"User-Agent":
									"just_audio/2.7.0 (Linux;Android 14) ExoPlayerLib/2.15.0",
								"Http_x_api_key": "8b3f76a8539",
							},
						},
						(r) => {
							fileUtil
  						.convertToMp3(r, "wav")
  						.then(stream => streamToBuffer(stream))
  						.then(buffer => resolve(buffer))
  						.catch(reject);

						}
					);

					req.on("error", reject);
					req.end();
					break;
				}

				/* -------------------- READLOUD -------------------- */
				case "readloud": {
					const req = https.request(
						{
							hostname: "101.99.94.14",
							path: voice.arg,
							method: "POST",
							headers: {
								Host: "tts.town",
								"Content-Type": "application/x-www-form-urlencoded",
							},
						},
						(r) => {
							const buffers = [];
							r.on("data", (b) => buffers.push(b));
							r.on("end", () => {
								const html = Buffer.concat(buffers);
								const beg = html.indexOf("/tmp/");
								const end = html.indexOf("mp3", beg) + 3;
								const filePath = html.subarray(beg, end).toString();

								if (!filePath) return reject("Could not find voice clip file");

								https.get(
									{
										hostname: "101.99.94.14",
										path: `/${filePath}`,
										headers: { Host: "tts.town" },
									},
									(r) => {
										const audio = [];
										r.on("data", (d) => audio.push(d));
										r.on("end", () => resolve(Buffer.concat(audio)));
										r.on("error", reject);
									}
								);
							});
						}
					);

					req.on("error", reject);
					req.end(
						new URLSearchParams({
							but1: text,
							butS: "0",
							butP: "0",
							butPauses: "0",
							but: "Submit",
						}).toString()
					);
					break;
				}
			}
		} catch (err) {
			reject(err);
		}
	});
}

/* ==================== VOICEFORGE TEXT ==================== */

function streamToBuffer(stream) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		stream.on("data", c => chunks.push(c));
		stream.on("end", () => resolve(Buffer.concat(chunks)));
		stream.on("error", reject);
	});
}

async function convertVoiceforgeText(text, voiceArg) {
	return new Promise((resolve) => {
		let inputText = text.toLowerCase();
		if (!inputText.includes("aaaaa")) return resolve(text);

		const pattern = /(?:gr|[a-z])a{2,}([a-z]?)/g;
		const matches = inputText.match(pattern);
		if (!matches) return resolve(text);

		for (const match of matches) {
			let voiceValues = ["aa"];
			const initialChar = match.charAt(0);

			// logic unchanged / placeholder
			// voiceValues manipulation would go here

			const xml = `<phoneme ph="${voiceValues.join(" ")}">Cepstral</phoneme>`;

			let modified = inputText
				.replace(match, xml)
				.replace(/!/g, "! ,")
				.replace(/\?/g, "? ,")
				.replace(/,/g, ", ;")
				.replace(/\./g, ". ,");

			return resolve(modified);
		}

		resolve(text);
	});
}