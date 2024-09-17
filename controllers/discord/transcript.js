const fetch = require('node-fetch');

const transcript = async (req, res) => {
    var url = req.query.url + '&';
    for (let key in req.query) {
        if(key === 'url') continue;
        url += key + '=' + req.query[key] + '&';
    }
    console.log(url);
    res.send(await (await fetch(url, {
        method: 'get',
    })).text())
}

module.exports = transcript;