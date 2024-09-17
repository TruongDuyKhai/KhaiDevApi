const express = require('express');
const router = express.Router();

router.get('/transcript', require(`${process.cwd()}/controllers/discord/transcript`));

module.exports = router;