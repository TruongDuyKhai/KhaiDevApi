const axios = require("axios");
const sharp = require("sharp");

// Helper: tải ảnh từ URL về Buffer
const fetchImage = async (url) => {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
};

// Tính năng gốc: thêm hiệu ứng ánh sáng mờ lên 1 ảnh
const decoSingle = async (req, res) => {
    const imageUrl = req.query.image;
    if (!imageUrl) {
        return res.status(400).send("Missing image URL");
    }

    const inputBuffer = await fetchImage(imageUrl);
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();
    const { width, height } = metadata;

    const svgOverlay = `
      <svg width="${width}" height="${height}">
        <defs>
          <radialGradient id="grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="white" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="white" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)"/>
      </svg>`;
    const overlayBuffer = Buffer.from(svgOverlay);

    const outputBuffer = await image
        .composite([{ input: overlayBuffer, blend: "over" }])
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
