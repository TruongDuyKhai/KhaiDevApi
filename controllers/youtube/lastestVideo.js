const axios = require('axios');
const parser = new (require('rss-parser'))();

const latestVideo = async (req, res) => {
    const key = req.params.key;
    const channelId = req.params.id;
    try {
        const data = (await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=1&order=date&type=video&key=${key}`)).data;
        const video = data.items[0]?.snippet;
        if (!video || video.title.toLowerCase().search('deleted') >= 0) return res.json({ message: 'video not found' })
        res.json({
            title: video.title,
            author: video.channelTitle,
            thumbnail: (video.thumbnails.high || video.thumbnails.default).url,
            link: `https://www.youtube.com/watch?v=${data.items[0].id.videoId}`,
            pubDate: video.publishedAt,
        })
    } catch (e) {
        try {
            var videos = (await parser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`)).items;

            videos = videos.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            const video = videos[0]
            if (!video || video.title.toLowerCase().search('deleted') >= 0) return res.json({ message: 'video not found' });
            res.json({
                title: video.title,
                author: video.author,
                link: `https://www.youtube.com/watch?v=${video.id.split(':')[2]}`,
                pubDate: video.pubDate,
            })
        } catch (e) {
            res.json({ message: e.message });
        }
    }
}

module.exports = latestVideo;