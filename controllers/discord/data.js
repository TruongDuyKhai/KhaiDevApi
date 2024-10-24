const axios = require('axios');

const index = async (req, res) => {
    res.send(`Welcome to the API to get Discord user's profile, avatar and banner, use /profile/:id, /avatar/:id or /banner/:id to get the information believe`);
}

const avatar = async (req, res) => {
    const userId = req.params.id;
    const token = req.query.token || process.env.TOKEN;
    const fallback = req.query.fallback;
    const decodedFallback = decodeURIComponent(fallback);
    axios({
        method: "GET",
        url: `https://discord.com/api/v9/users/${userId}/profile`,
        headers: {
            "authorization": token,
        },
    })
        .then(response => {
            const avatarId = response.data.user.avatar;

            if (!avatarId) {
                if (fallback) {
                    axios({
                        method: "GET",
                        url: decodedFallback,
                        responseType: "arraybuffer",
                        headers: {
                            "Content-Type": "image/*",
                        },
                    })
                        .then(fallbackResponse => {
                            const contentType = response.headers["content-type"];
                            var extension = "webp";
                            if (contentType === "image/gif") {
                                extension = "gif";
                            } else if (contentType === "image/png") {
                                extension = "png";
                            } else if (contentType === "image/jpeg" || contentType === "image/jpg") {
                                extension = "jpg";
                            }
                            res.setHeader('Content-Type', contentType);
                            res.send(Buffer.from(fallbackResponse.data, 'binary'));
                        })
                        .catch(err => {
                            res.status(500).send("Error fetching fallback image");
                        });
                    return;
                }
                res.status(404).send("User has no avatar");
                return;
            }

            axios({
                method: "GET",
                url: `https://cdn.discordapp.com/avatars/${userId}/${avatarId}?size=2048`,
                responseType: "arraybuffer",
                headers: {
                    "Content-Type": "image/*",
                },
            })
                .then(response => {
                    if (response.status !== 200) {
                        throw new Error(`Network response was not ok. Status: ${response.status} ${response.statusText}`);
                    }

                    const contentType = response.headers["content-type"];
                    var extension = "webp";
                    if (contentType === "image/gif") {
                        extension = "gif";
                    } else if (contentType === "image/png") {
                        extension = "png";
                    } else if (contentType === "image/jpeg" || contentType === "image/jpg") {
                        extension = "jpg";
                    }

                    res.set("Content-Type", contentType);
                    res.send(response.data);
                })
                .catch(error => {
                    console.error("Request Error:", error.message);
                    res.status(500).send("Error retrieving user image");
                });
        })
        .catch(error => {
            console.error("Request Error:", error.message);
            res.status(500).send("Error retrieving user profile");
        });
}

const badge = async (req, res) => {
    const badgeId = req.params.id;

    axios({
        method: "GET",
        url: `https://cdn.discordapp.com/badge-icons/${badgeId}`,
        responseType: "arraybuffer",
        headers: {
            "Content-Type": "image/*",
        },
    }).then(response => {
        if (response.status !== 200) {
            throw new Error(`Network response was not ok. Status: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers["content-type"];
        let extension = "webp";

        if (contentType === "image/gif") {
            extension = "gif";
        } else if (contentType === "image/png") {
            extension = "png";
        } else if (contentType === "image/jpeg" || contentType === "image/jpg") {
            extension = "jpg";
        }

        res.set("Content-Type", contentType);
        res.send(response.data);
    }).catch(error => {
        console.error("Request Error:", error.message);
        res.status(500).send("Error getting badge icon");
    });
}

const banner = async (req, res) => {
    const userId = req.params.id;
    const token = req.query.token || process.env.TOKEN;
    const fallback = req.query.fallback;
    const decodedFallback = decodeURIComponent(fallback);
    axios({
        method: "GET",
        url: `https://discord.com/api/v9/users/${userId}/profile`,
        headers: {
            "authorization": token,
        },
    })
        .then(response => {
            const bannerId = response.data.user.banner;

            if (!bannerId) {
                if (fallback) {
                    if (decodedFallback) {
                        axios({
                            method: "GET",
                            url: decodedFallback,
                            responseType: "arraybuffer",
                            headers: {
                                "Content-Type": "image/*",
                            },
                        })

                            .then(fallbackResponse => {
                                const contentType = response.headers["content-type"];
                                var extension = "webp";
                                if (contentType === "image/gif") {
                                    extension = "gif";
                                } else if (contentType === "image/png") {
                                    extension = "png";
                                } else if (contentType === "image/jpeg" || contentType === "image/jpg") {
                                    extension = "jpg";
                                }
                                res.setHeader('Content-Type', contentType);
                                res.send(Buffer.from(fallbackResponse.data, 'binary'));
                            })
                            .catch(err => {
                                res.status(500).send("Error fetching fallback image");
                            });
                        return;
                    }
                }
                res.status(404).send("User has no banner");
                return;
            }

            axios({
                method: "GET",
                url: `https://cdn.discordapp.com/banners/${userId}/${bannerId}?size=2048`,
                responseType: "arraybuffer",
                headers: {
                    "Content-Type": "image/*",
                },
            })
                .then(response => {
                    if (response.status !== 200) {
                        throw new Error(`Network response was not ok. Status: ${response.status} ${response.statusText}`);
                    }

                    const contentType = response.headers["content-type"];
                    var extension = "webp";
                    if (contentType === "image/gif") {
                        extension = "gif";
                    } else if (contentType === "image/png") {
                        extension = "png";
                    } else if (contentType === "image/jpeg" || contentType === "image/jpg") {
                        extension = "jpg";
                    }

                    res.set("Content-Type", contentType);
                    res.send(response.data);
                })
                .catch(error => {
                    console.error("Request Error:", error.message);
                    res.status(500).send("Error retrieving user image");
                });
        })
        .catch(error => {
            console.error("Request Error:", error.message);
            res.status(500).send("Error retrieving user profile");
        });
}

const profile = async (req, res) => {
    const userId = req.params.id;
    const token = req.query.token || process.env.TOKEN;

    axios({
        method: "GET",
        url: `https://discord.com/api/v9/users/${userId}/profile`,
        headers: {
            "authorization": token,
        },
    }).then(response => {
        return res.send(response.data);
    })
        .catch(error => {
            console.error("Request Error:", error.message);
            return res.status(500).send("Error retrieving user profile");
        });
}

module.exports = {
    index,
    avatar,
    badge,
    banner,
    profile
}