const axios = require("axios");
const sharp = require("sharp");

const fetchImage = async (url) => {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data, "binary");
};

// Ghép các layer của một profile-frame quanh ảnh profile demo ĐẦY ĐỦ (không
// crop). Vị trí layer suy ra từ inner_width + overflow_* giống cách Discord
// render: mọi offset là tỉ lệ theo bề rộng profile.
//
// Query: sku, iw (inner_width), ot/ob/oh (overflow top/bottom/horizontal),
//        layers = "id,anchor,order;id,anchor,order;..."  (anchor: top|bottom|center)
const frame = async (req, res) => {
    try {
        const { sku, iw, layers } = req.query;
        const IW = Number(iw);
        const OT = Number(req.query.ot) || 0;
        const OB = Number(req.query.ob) || 0;
        const OH = Number(req.query.oh) || 0;
        if (!sku || !layers || !IW) {
            return res.status(400).send("Missing sku / iw / layers");
        }
        const parsed = layers
            .split(";")
            .filter(Boolean)
            .map((s) => {
                const [id, anchor, order] = s.split(",");
                return { id, anchor, order };
            });

        const PROFILE = `${process.cwd()}/assets/images/profile.png`;
        const profBuf = await sharp(PROFILE).png().toBuffer();
        const { width: pw, height: ph } = await sharp(profBuf).metadata();

        const otPx = Math.round((pw * OT) / IW);
        const obPx = Math.round((pw * OB) / IW);
        const ohPx = Math.round((pw * OH) / IW);
        const layerW = pw + 2 * ohPx; // layer rộng hơn profile 2 phía ngang
        const canvasW = layerW;
        const canvasH = otPx + ph + obPx;
        const profLeft = ohPx;
        const profTop = otPx;

        // Chuẩn bị từng layer: tải, resize theo bề rộng canvas, tính top.
        const prepared = await Promise.all(
            parsed.map(async (l) => {
                const buf = await fetchImage(
                    `https://cdn.discordapp.com/media/v1/collectibles-shop/${sku}/${l.id}/static`,
                );
                if (l.anchor === "center") {
                    // rail (responsive): kéo giãn đúng chiều cao profile
                    const input = await sharp(buf)
                        .resize(layerW, ph, { fit: "fill" })
                        .png()
                        .toBuffer();
                    return { ...l, input, top: profTop };
                }
                const input = await sharp(buf)
                    .resize({ width: layerW })
                    .png()
                    .toBuffer();
                const { height: lh } = await sharp(input).metadata();
                const top =
                    l.anchor === "bottom"
                        ? Math.max(0, canvasH - lh) // mép dưới chạm đáy canvas
                        : 0; // anchor top: mép trên chạm đỉnh canvas
                return { ...l, input, top };
            }),
        );

        const back = prepared.filter((p) => p.order === "back");
        const front = prepared.filter((p) => p.order !== "back");

        const composites = [
            ...back.map((p) => ({ input: p.input, left: 0, top: p.top })),
            { input: profBuf, left: profLeft, top: profTop },
            ...front.map((p) => ({ input: p.input, left: 0, top: p.top })),
        ];

        const out = await sharp({
            create: {
                width: canvasW,
                height: canvasH,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite(composites)
            .png()
            .toBuffer();

        res.type("image/png");
        res.send(out);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error rendering frame");
    }
};

module.exports = frame;
