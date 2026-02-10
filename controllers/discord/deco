const axios = require("axios");
const sharp = require("sharp");

const transcript = async (req, res) => {
    try {
        const imageUrl = req.query.image;
        if (!imageUrl) {
            return res.status(400).send("Missing image URL");
        }
        // Tải ảnh từ URL đầu vào (định dạng nhị phân)
        const response = await axios.get(imageUrl, {
            responseType: "arraybuffer",
        });
        const inputBuffer = Buffer.from(response.data, "binary"); // Buffer từ dữ liệu ảnh:contentReference[oaicite:7]{index=7}

        // Khởi tạo Sharp từ ảnh input
        const image = sharp(inputBuffer);
        const metadata = await image.metadata();
        const { width, height } = metadata;

        // Tạo overlay SVG hiệu ứng ánh sáng mờ (trắng -> trong suốt) kích thước bằng ảnh
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

        // Chồng overlay lên ảnh gốc, giữ nền trong suốt
        const outputBuffer = await image
            .composite([{ input: overlayBuffer, blend: "over" }]) // dùng overlay buffer tạo từ SVG:contentReference[oaicite:8]{index=8}
            .png()
            .toBuffer();

        // Thiết lập header và gửi ảnh PNG kết quả
        res.type("image/png");
        res.send(outputBuffer);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error processing image");
    }
};

module.exports = transcript;
