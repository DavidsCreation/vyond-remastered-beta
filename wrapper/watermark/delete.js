const formidable = require('formidable');
const fs = require('fs');

module.exports = function (req, res, url) {
	if (req.method != 'POST' || url.path != '/api/watermark/delete') return;
	new formidable.IncomingForm().parse(req, (e, f) => {
		try {
            fs.unlinkSync(`../_WATERMARKS/${f.id}`);
            res.end(JSON.stringify({status: "ok"}));
        } catch (e) {
            console.log(e);
            res.end(JSON.stringify({status: "error", msg: e}));
        }
	});
	return true;
}
