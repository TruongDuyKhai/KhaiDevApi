const axios = require('axios');
const cheerio = require('cheerio');

const channelId = async (req, res) => {
    const url = req.query.url;
    if (!url) return res.status(400).send({ message: 'URL not found' });
    if (url.search('youtube') < 0) return res.status(400).send({ message: 'The URL must originate from youtube' });
    const data = (await axios.get(url)).data;
    const $ = cheerio.load(data);
    const link = $(`meta[property="og:url"]`).attr('content');
    res.json({
        url: link
    })
}

module.exports = channelId;