const fetch = require("node-fetch");
const zlib = require("zlib");
const { pipeline } = require("stream/promises");

/**
 * Xem transcript ticket của ArnTo-Shop.
 *
 * ?url= nhận một trong hai dạng:
 *
 *  1. ĐỊNH DẠNG v1 (nhị phân, base64url) — transcript đã gzip + cắt mảnh.
 *     Sinh ra bởi functions/transcriptLink.js bên ArnTo-Shop, đặc tả đầy đủ
 *     nằm ở đó. Sửa một bên thì phải sửa cả hai.
 *
 *  2. base64 của một URL CDN (cách cũ) — giữ lại để các transcript .html đã
 *     gửi trước đây vẫn xem được.
 *
 * Phân biệt bằng byte đầu: v1 luôn là 0x01, dạng cũ bắt đầu bằng "h" của
 * "https" (0x68).
 */

const ALLOWED_HOSTS = new Set(["cdn.discordapp.com", "media.discordapp.net"]);

const page = (title, body) =>
    `<!doctype html><meta charset="utf-8"><title>${title}</title>` +
    `<div style="font:16px/1.6 system-ui;max-width:34rem;margin:15vh auto;padding:0 1rem">` +
    `<h2 style="margin:0 0 .5rem">${title}</h2><p>${body}</p></div>`;

const EXPIRED = page(
    "Link đã hết hạn",
    "Chữ ký của link chỉ sống 24 giờ. Hãy quay lại kênh transcript trên " +
        "Discord và bấm <b>View Transcript</b> để lấy link mới.",
);

/** Giải mã định dạng v1 → danh sách URL CDN đã ký, đúng thứ tự mảnh. */
function unpack(buf) {
    let o = 0;
    const version = buf.readUInt8(o); o += 1;
    if (version !== 1) throw new Error("version không hỗ trợ");

    const channelId = buf.readBigUInt64BE(o).toString(); o += 8;
    const ex = buf.readUInt32BE(o); o += 4;
    const is = buf.readUInt32BE(o); o += 4;
    const n = buf.readUInt8(o); o += 1;
    const nameLen = buf.readUInt8(o); o += 1;
    const baseName = buf.subarray(o, o + nameLen).toString("ascii"); o += nameLen;

    if (buf.length !== o + n * 40) throw new Error("độ dài payload không khớp");

    const ids = [];
    for (let i = 0; i < n; i++) { ids.push(buf.readBigUInt64BE(o).toString()); o += 8; }

    const urls = [];
    for (let i = 0; i < n; i++) {
        const hm = buf.subarray(o, o + 32).toString("hex"); o += 32;
        const name = `${baseName}.${String(i).padStart(3, "0")}.gz`;
        urls.push(
            `https://cdn.discordapp.com/attachments/${channelId}/${ids[i]}/${name}` +
                `?ex=${ex.toString(16)}&is=${is.toString(16)}&hm=${hm}`,
        );
    }
    return { urls, ex, gzip: true };
}

/** Dạng cũ: base64 của đúng một URL CDN. */
function legacy(raw) {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.hostname)) {
        throw new Error("host không được phép");
    }
    const ex = u.searchParams.get("ex");
    return {
        urls: [u.href],
        ex: ex ? parseInt(ex, 16) : 0,
        gzip: u.pathname.endsWith(".gz"),
    };
}

const transcript = async (req, res) => {
    let job;
    try {
        const buf = Buffer.from(String(req.query.url || ""), "base64");
        if (!buf.length) throw new Error("thiếu tham số url");
        job = buf[0] === 1 ? unpack(buf) : legacy(buf.toString("utf8"));
    } catch (err) {
        return res
            .status(400)
            .type("html")
            .send(page("Link không hợp lệ", err.message));
    }

    // Chữ ký nằm sẵn trong link nên biết trước hạn — khỏi phải gọi CDN.
    if (job.ex && job.ex * 1000 < Date.now()) {
        return res.status(410).type("html").send(EXPIRED);
    }

    // Không gom vào bộ nhớ: bơm thẳng từng mảnh qua gunzip rồi đẩy ra client.
    // Bộ nhớ dùng gần như không đổi dù transcript lớn tới đâu — quan trọng vì
    // API chạy trên gói Render nhỏ.
    let head = true;
    const out = job.gzip ? zlib.createGunzip() : null;

    try {
        for (let i = 0; i < job.urls.length; i++) {
            const upstream = await fetch(job.urls[i]);

            if (!upstream.ok) {
                if (!head) throw new Error(`mảnh ${i} lỗi ${upstream.status}`);
                const gone = upstream.status === 403 || upstream.status === 404;
                return res
                    .status(gone ? 410 : 502)
                    .type("html")
                    .send(
                        gone
                            ? EXPIRED
                            : page(
                                  "Không tải được transcript",
                                  `Discord trả về ${upstream.status}.`,
                              ),
                    );
            }

            if (head) {
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.setHeader("X-Content-Type-Options", "nosniff");
                if (out) out.pipe(res);
                head = false;
            }

            if (out) await pipeline(upstream.body, out, { end: false });
            else await pipeline(upstream.body, res, { end: false });
        }
        if (out) out.end();
        else res.end();
    } catch (err) {
        // Đã trót gửi header thì không sửa status được nữa, chỉ cắt kết nối để
        // trình duyệt biết là tải dở.
        console.warn(`[transcript] ${err.message}`);
        if (head) {
            res.status(502).type("html").send(page("Lỗi tải transcript", err.message));
        } else {
            res.destroy();
        }
    }
};

module.exports = transcript;
