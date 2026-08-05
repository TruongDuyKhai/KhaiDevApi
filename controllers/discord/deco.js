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

// Số nguyên RGB (vd 855309) -> "#rrggbb"
const intToHex = (n) =>
    "#" + ((n >>> 0) & 0xffffff).toString(16).padStart(6, "0");

// SVG gradient chéo phủ kín kích thước cho trước, từ danh sách màu
const gradientSvg = (width, height, hexColors) => {
    const stops = hexColors
        .map((c, i) => {
            const offset =
                hexColors.length > 1
                    ? ((i / (hexColors.length - 1)) * 100).toFixed(1)
                    : 0;
            return `<stop offset="${offset}%" stop-color="${c}"/>`;
        })
        .join("");
    return Buffer.from(
        `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">` +
            `<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">${stops}</linearGradient></defs>` +
            `<rect width="100%" height="100%" fill="url(#g)"/></svg>`,
    );
};

// Bundle: có image2 -> ghép 2 lớp như cũ; không có image2 nhưng có `colors`
// (bundle 1 lớp) -> vẽ nền gradient rồi đặt foreground (image1) lên trên.
const decoBundle = async (req, res) => {
    const { image1, image2, colors } = req.query;
    if (!image1) {
        return res.status(400).send("Missing image1 URL");
    }
    const buffer1 = await fetchImage(image1);

    // Bundle 2 lớp: đè image2 lên image1 (giữ nguyên hành vi cũ).
    if (image2) {
        const buffer2 = await fetchImage(image2);
        const outputBuffer = await sharp(buffer1)
            .composite([{ input: buffer2, blend: "over" }])
            .png()
            .toBuffer();
        res.type("image/png");
        return res.send(outputBuffer);
    }

    // Bundle 1 lớp: nền = gradient từ colors, foreground = image1 đặt lên trên.
    const hexColors = (colors || "")
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n))
        .map(intToHex);
    if (hexColors.length === 0) {
        // Không có màu nền -> trả thẳng foreground.
        res.type("image/png");
        return res.send(await sharp(buffer1).png().toBuffer());
    }
    const { width, height } = await sharp(buffer1).metadata();
    const bg = await sharp(gradientSvg(width, height, hexColors)).png().toBuffer();
    const outputBuffer = await sharp(bg)
        .composite([{ input: buffer1, blend: "over" }])
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
