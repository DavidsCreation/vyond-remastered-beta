const voices = require("./info").voices;
const qs = require("querystring");
const fs = require("fs");
const https = require("https");
const http = require("http");
const get = require("../request/get");
const fileUtil = require("../fileUtil");
const md5 = require("js-md5");
const ffmpeg = require("fluent-ffmpeg");
const path = require('path');
ffmpeg.setFfmpegPath(require("@ffmpeg-installer/ffmpeg").path);

module.exports = (voiceName, text, headers) => {
	return new Promise(async (res, rej) => {
		const voice = voices[voiceName];
		if (!voice) return rej("That voice dosen't seem to exist")
		switch (voice.source) {
			case "vocalware": {
				var [eid, lid, vid] = voice.arg;
				var cs = md5(`${eid}${lid}${vid}${text}1mp35883747uetivb9tb8108wfj`);
				var q = qs.encode({
					EID: voice.arg[0],
					LID: voice.arg[1],
					VID: voice.arg[2],
					TXT: text,
					EXT: "mp3",
					IS_UTF8: 1,
					ACC: 5883747,
					cache_flag: 3,
					CS: cs,
				});
				https.get({
					host: "cache-a.oddcast.com",
					path: `/tts/gen.php?${q}`,
					headers: {
						Referer: "https://www.oddcast.com/",
						Origin: "https://www.oddcast.com/",
						"User-Agent": headers['user-agent'],
					},
				},
				(r) => {
					var buffers = [];
					r.on("data", (d) => buffers.push(d));
					r.on("end", () => res(Buffer.concat(buffers)));
					r.on("error", rej);
				});
				break;
			}
			case "cepstral": {
				https.get('https://www.cepstral.com/en/demos', r => {
					const cookie = r.headers['set-cookie'];
					var q = qs.encode({
						voiceText: text,
						voice: voice.arg,
						createTime: 666,
						rate: 170,
						pitch: 1,
						sfx: 'none',
					});
					var buffers = [];
					var req = https.get({
						host: 'www.cepstral.com',
						path: `/demos/createAudio.php?${q}`,
						headers: { Cookie: cookie },
						method: 'GET',
					}, r => {
						r.on('data', b => buffers.push(b));
						r.on('end', () => {
							var json = JSON.parse(Buffer.concat(buffers));
							get(`https://www.cepstral.com${json.mp3_loc}`).then(res).catch(rej);
						})
					});
				});
				break;
			}
			case "voiceforge": {
				const q = new URLSearchParams({
					text: text,
					voice: voice.arg
				}).toString();

				https.get({
					hostname: "voice-hub.replit.app",
					path: `/demo/createAudio.php?${q}`
				}, (r) => {
					let buffers = "";
					r.on("data", (b) => buffers += b)
					r.on("end", async () => {
						//I wish I did this better but node was being its stupid self again
						console.log(Buffer.from(buffers.substring(22)), 'base64');
						fs.writeFileSync("./_CACHÉ/file.wav", Buffer.from(buffers.substring(22), 'base64'));
						let stream = fs.createWriteStream("./_CACHÉ/output.mp3");
						ffmpeg()
							.input("./_CACHÉ/file.wav")
							.inputFormat("wav")
							.audioBitrate('44100k')
							.toFormat("mp3")
							.on("error", (e) => rej("Error converting audio:", e))
							.pipe(stream);
						stream.on('finish', function () {
							res(fs.readFileSync("./_CACHÉ/output.mp3"))
						});
					})
				});
				break;
			  }
			  case "readloud": {
				const req = https.request(
					{
						hostname: "101.99.94.14",														
						path: voice.arg,
						method: "POST",
						headers: { 			
							Host: "gonutts.net",					
							"Content-Type": "application/x-www-form-urlencoded"
						}
					},
					(r) => {
						let buffers = [];
						r.on("data", (b) => buffers.push(b));
						r.on("end", () => {
							const html = Buffer.concat(buffers);
							const beg = html.indexOf("/tmp/");
							const end = html.indexOf("mp3", beg) + 3;
							const path = html.subarray(beg, end).toString();

							if (path.length > 0) {
								https.get({
									hostname: "101.99.94.14",	
									path: `/${path}`,
									headers: {
										Host: "gonutts.net"
									}
								}, (r) => {
									var buffers = [];
									r.on("data", (d) => buffers.push(d));
									r.on("end", () => res(Buffer.concat(buffers)));
									r.on("error", rej);
								}).on("error", rej);
							} else {
								return rej("Could not find voice clip file in response.");
							}
						});
					}
				);
				req.on("error", rej);
				req.end(
					new URLSearchParams({
						but1: text,
						butS: 0,
						butP: 0,
						butPauses: 0,
						but: "Submit",
					}).toString()
				);
				break;
			}
		}
	});
};