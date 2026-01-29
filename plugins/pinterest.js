const axios = require('axios')

module.exports = {
    name: "Pinterest Search",
    command: ["pin", "pinterest"],
    noPrefix: false,
    execute: async (sock, m, { args, prefix, command }) => {
        try {
            // 1. Cek Query
            if (!args || args.length < 1) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `⚠️ Masukkan kata kunci!\nContoh: *${prefix + command} Dark Purple Aesthetic*` 
                }, { quoted: m })
            }

            const query = args.join(" ")
            
            // Indikator Loading (Searching)
            await sock.sendMessage(m.key.remoteJid, { react: { text: "🔍", key: m.key } })

            // 2. Cari Gambar via API
            // Menggunakan API public yang stabil untuk scrape Pinterest
            const { data } = await axios.get(`https://www.bing.com/images/search?q=${encodeURIComponent(query + " pinterest")}&first=1&count=10&adlt=off`)
            
            // Parsing hasil HTML (Simple Regex Scraper karena Bing Image lebih stabil daripada API Pinterest gratisan)
            // Kita ambil link gambar dari source code
            const pattern = /murl&quot;:&quot;(.*?)&quot;/g
            let match
            let images = []
            
            while ((match = pattern.exec(data)) !== null) {
                if (images.length < 5) { // Kita ambil maksimal 5 gambar
                    images.push(match[1])
                }
            }

            if (images.length === 0) {
                return await sock.sendMessage(m.key.remoteJid, { text: "❌ Gambar tidak ditemukan." }, { quoted: m })
            }

            // 3. Kirim Gambar (Mode Album/Slide)
            // Kita loop images dan kirim satu per satu (atau kalau WA support album, dia akan numpuk)
            
            // Kirim pesan pembuka
            await sock.sendMessage(m.key.remoteJid, { 
                text: `🎨 *PINTEREST SEARCH*\n🔎 Query: _${query}_\n📸 Total: ${images.length} Images` 
            }, { quoted: m })

            for (let i = 0; i < images.length; i++) {
                // Delay sedikit agar tidak spamming error
                await new Promise(r => setTimeout(r, 1000))
                
                await sock.sendMessage(m.key.remoteJid, { 
                    image: { url: images[i] },
                    // Caption hanya di gambar pertama agar tidak penuh
                    caption: i === 0 ? `Result for: *${query}*` : ""
                })
            }

            await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } })

        } catch (e) {
            console.error("Pinterest Error:", e)
            await sock.sendMessage(m.key.remoteJid, { text: "❌ Terjadi kesalahan saat mencari gambar." }, { quoted: m })
        }
    }
}
