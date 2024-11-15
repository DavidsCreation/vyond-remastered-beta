/***
 * movie list route
 */
const movie = require("./main.ts");

module.exports = function (req, res, url) {
	if (req.method != "GET" || url.path != "/movieList") return;
	try {
		Promise.all(movie.list().map(movie.meta)).then(a => res.end(JSON.stringify(a.sort((a, b) => new Date(b.date) - new Date(a.date)))));
	} catch (err) {
		if (process.env.NODE_ENV == "dev") throw err;
		console.error("Error listing movies: " + err)
		res.end(JSON.stringify([]))
	}
	return true;
}