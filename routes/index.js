const express = require('express');
const router = express.Router();

router.use('/discord', require(`./discord`));
router.use('/youtube', require(`./youtube`));
router.use('/transcript', require(`./transcript`));

router.all('/', (req, res) => {
    res.sendStatus(200);
})

module.exports = router;