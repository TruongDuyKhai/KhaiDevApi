const { WebhookClient } = require('discord.js');

const index = async (req, res) => {
    res.sendStatus(200);
}

const send = async (req, res) => {
    const id = req.query.id;
    const token = req.query.token;
    const options = req.body;
    const webhook = new WebhookClient({ id, token });
    webhook.send(options).then((msg) => {
        res.status(200).send(msg);
    }).catch((e) => {
        res.status(e.status).send(e);
    })
}

module.exports = {
    index,
    send
}