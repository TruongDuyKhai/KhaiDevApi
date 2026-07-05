const axios = require("axios");
const sharp = require("sharp");

// Helper: tải ảnh từ URL về Buffer
const fetchImage = async (url) => {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
};

// Tính năng gốc: thêm hiệu ứng ánh sáng mờ lên 1 ảnh
const decoSingle = async (req, res) => {
    const type = req.query.type;
    const imageURL = req.query.image;
    const buffer2 = await fetchImage(imageURL);
    const fs = require("fs");
    const buffer1 = fs.readFileSync(
        `./assets/images/${type == 0 ? "avatar" : type == 1 ? "profile" : "nameplate"}.png`,
    );
    // Nameplate (type=2) là banner ngang (448x84), phần trong suốt bên trái
    // là chỗ dành cho avatar: giữ nguyên khung banner và đặt nameplate.png
    // vào mép trái thay vì crop banner về hình vuông
    if (type == 2) {
        const { height: bannerHeight } = await sharp(buffer2).metadata();
        const overlay = await sharp(buffer1)
            .resize(bannerHeight, bannerHeight, { fit: "cover" })
            .png()
            .toBuffer();
        const outputBuffer = await sharp(buffer2)
            .composite([{ input: overlay, left: 0, top: 0 }])
            .png()
            .toBuffer();
        res.type("image/png");
        return res.send(outputBuffer);
    }
    const { width, height } = await sharp(buffer1).metadata();
    const resizedBuffer2 = await sharp(buffer2)
        .resize(width, height, { fit: "cover" })
        .png()
        .toBuffer();
    const outputBuffer = await sharp(buffer1)
        .composite([{ input: resizedBuffer2, blend: "over" }])
        .png()
        .toBuffer();
    res.type("image/png");
    res.send(outputBuffer);
};

// Tính năng mới: ghép 2 ảnh chồng lên nhau (đè ảnh 2 lên ảnh 1)
const decoBundle = async (req, res) => {
    const { image1, image2 } = req.query;
    if (!image1 || !image2) {
        return res.status(400).send("Missing image1 or image2 URL");
    }

    // Tải song song 2 ảnh
    const [buffer1, buffer2] = await Promise.all([
        fetchImage(image1),
        fetchImage(image2),
    ]);

    // Đè ảnh 2 lên ảnh 1 (blend: over giữ kênh alpha)
    const outputBuffer = await sharp(buffer1)
        .composite([{ input: buffer2, blend: "over" }])
        .png()
        .toBuffer();

    res.type("image/png");
    res.send(outputBuffer);
};

// Router chính: phân loại theo ?type=
const deco = async (req, res) => {
    try {
        const type = req.query.type;

        if (type === "bundle") {
            return await decoBundle(req, res);
        }

        // Mặc định: tính năng gốc
        return await decoSingle(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing image");
    }
};

module.exports = deco;
