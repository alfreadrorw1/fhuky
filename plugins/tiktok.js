const axios = require("axios")

module.exports = {
    name: "TikTok Downloader",
    command: ["tiktok", "tt", "ttdl"],
    execute: async (sock, m, { args, prefix, command }) => {
        if (!args[0]) {
            return sock.sendMessage(m.key.remoteJid, { 
                text: `⚠️ *Gunakan format:* ${prefix}${command} <url tiktok>\n\nContoh:\n${prefix}${command} https://vt.tiktok.com/xxxx/` 
            }, { quoted: m })
        }

        const url = args[0]
        if (!url.match(/tiktok.com/gi)) {
            return sock.sendMessage(m.key.remoteJid, { text: "⚠️ Link tidak valid!" }, { quoted: m })
        }

        await sock.sendMessage(m.key.remoteJid, { react: { text: "⏳", key: m.key } })

        try {
            const { data } = await axios.post("https://www.tikwm.com/api/", {
                url: url,
                count: 12, 
                cursor: 0, 
                web: 1, 
                hd: 1
            })

            const res = data.data
            if (!res) throw new Error("Data tidak ditemukan")

            // --- BAGIAN FIX ---
            // 1. Cek apakah URL relatif (awalan /), jika ya tambahkan domain
            let videoUrl = res.play
            if (!videoUrl.startsWith("http")) {
                videoUrl = `https://www.tikwm.com${videoUrl}`
            }

            // 2. Download video ke Buffer dulu (Lebih stabil di Panel/Termux)
            const buffer = await axios.get(videoUrl, { 
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                },
                responseType: 'arraybuffer' 
            })
            // ------------------

            const caption = `💜 *UBOT TIKTOK DOWNLOADER* 💜

👤 *Author:* ${res.author?.nickname}
📝 *Title:* ${res.title}
👀 *Views:* ${res.play_count}
⬇️ *Download:* Buffer (Stable)

_Video sedang dikirim..._`

            await sock.sendMessage(m.key.remoteJid, { 
                video: buffer.data, // Kirim Buffer
                caption: caption
            }, { quoted: m })

            await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } })

        } catch (e) {
            console.error("TikTok Error:", e)
            await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } })
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal mengambil video. Pastikan link benar & tidak di-private." }, { quoted: m })
        }
    }
}
