const fetch = require("node-fetch");

const transcript = async (req, res) => {
    const url = atob(req.query.url);
    res.send(
        await (
            await fetch(url, {
                method: "get",
            })
        ).text()
    );
};

module.exports = transcript;
