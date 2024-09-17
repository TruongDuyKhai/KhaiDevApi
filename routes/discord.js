const express = require('express');
const router = express.Router();
const cors = require('cors');
let allowedOrigins = [
    'http://localhost:3200',
    'https://khaidev.vercel.app',
    'https://lamdev.vercel.app',
    'https://noflexzone.vercel.app'
]
var corsOptions = {
    origin: function (origin, callback) {
        if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

router.all('/', (req, res) => {
    res.sendStatus(200);
})

router.all('/webhook', require(`${process.cwd()}/controllers/discord/webhook`).index);
router.post('/webhook/send', require(`${process.cwd()}/controllers/discord/webhook`).send);
router.get('/transcript', require(`${process.cwd()}/controllers/discord/transcript`));
router.get('/data', cors(corsOptions), require(`${process.cwd()}/controllers/discord/data`).index);
router.get('/data/avatar/:id', cors(corsOptions), require(`${process.cwd()}/controllers/discord/data`).avatar);
router.get('/data/badge/:id', cors(corsOptions), require(`${process.cwd()}/controllers/discord/data`).badge);
router.get('/data/banner/:id', cors(corsOptions), require(`${process.cwd()}/controllers/discord/data`).banner);
router.get('/data/profile/:id', cors(corsOptions), require(`${process.cwd()}/controllers/discord/data`).profile);


module.exports = router;