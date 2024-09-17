console.clear();
require('dotenv').config();
const express = require('express');
const config = require('./config');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.listen(config.port, () => {
    console.log(`[INFO] App listening on port :: ${config.port}`)
})

app.use('/', require(`./routes`));