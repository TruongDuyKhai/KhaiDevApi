const express = require('express');
const router = express.Router();

router.all('/', (req, res) => {
    res.sendStatus(200);
})

router.all('/webhook', require(`${process.cwd()}/controllers/discord/webhook`).index);
router.post('/webhook/send', require(`${process.cwd()}/controllers/discord/webhook`).send);
router.get('/transcript', require(`${process.cwd()}/controllers/discord/transcript`));
router.get('/data', require(`${process.cwd()}/controllers/discord/data`).index);
router.get('/data/avatar/:id', require(`${process.cwd()}/controllers/discord/data`).avatar);
router.get('/data/badge/:id', require(`${process.cwd()}/controllers/discord/data`).badge);
router.get('/data/banner/:id', require(`${process.cwd()}/controllers/discord/data`).banner);
router.get('/data/profile/:id', require(`${process.cwd()}/controllers/discord/data`).profile);


module.exports = router;