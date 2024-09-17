const express = require('express');
const router = express.Router();

router.all('/', (req, res) => {
    res.sendStatus(200);
})
router.all('/lastestVideo/:key/:id', require(`${process.cwd()}/controllers/youtube/lastestVideo`));
router.all('/channelId', require(`${process.cwd()}/controllers/youtube/channelId`));

module.exports = router;