const axios = require('axios')

module.exports = {
    name: "IQC Maker",
    command: ["iqc"], // Command yang akan dipanggil
    execute: async (sock, m, { args, prefix, command }) => {
        try {
            // Menggabungkan args menjadi satu string
            let text = args.join(" ")

            // Validasi input
            if (!text) return sock.sendMessage(m.key.remoteJid, { 
                text: `Mana teksnya?\n\n*Example:*\n${prefix + command} elyas ganteng\n\n*Custom:*\n${prefix + command} Teks | Baterai | Sinyal | Jam\n${prefix + command} Halo | 100 | 4 | 10:00` 
            }, { quoted: m })

            // Parsing input sesuai logika contoh
            let parts = text.split("|").map(s => s.trim())
            let pesan = parts[0]
            let baterai = 3 // Default sample
            let sinyal = 3 // Default sample
            let jam

            if (!pesan) return

            // Logika parsing parameter (Battery, Sinyal, Jam)
            if (parts.length === 2) {
                jam = parts[1]
            } else if (parts.length === 3) {
                baterai = !isNaN(parts[1]) ? parseInt(parts[1]) : 3
                sinyal = !isNaN(parts[2]) ? parseInt(parts[2]) : 3
            } else if (parts.length === 4) {
                baterai = !isNaN(parts[1]) ? parseInt(parts[1]) : 3
                sinyal = !isNaN(parts[2]) ? parseInt(parts[2]) : 3
                jam = parts[3]
            }

            // Batasi nilai agar valid
            if (baterai < 0) baterai = 0
            if (baterai > 100) baterai = 100
            if (sinyal < 1) sinyal = 1
            if (sinyal > 4) sinyal = 4

            // Default jam = sekarang WIB (jika tidak diisi user)
            if (!jam) {
                const now = new Date()
                const utc = now.getTime() + (now.getTimezoneOffset() * 60000)
                const wib = new Date(utc + (7 * 3600000)) // UTC+7
                const h = String(wib.getHours()).padStart(2, "0")
                const min = String(wib.getMinutes()).padStart(2, "0")
                jam = `${h}:${min}`
            }

            // Validasi format jam sederhana
            if (jam && !jam.includes(":")) {
                // Jika user salah input jam, biarkan default atau beri peringatan (disini kita biarkan jalan apa adanya/reset)
            }

            // URL API
            let apiUrl = `https://brat.siputzx.my.id/iphone-quoted?messageText=${encodeURIComponent(pesan)}&carrierName=TELKOMSEL&batteryPercentage=${baterai}&signalStrength=${sinyal}&time=${encodeURIComponent(jam)}`

            // Kirim reaksi loading
            await sock.sendMessage(m.key.remoteJid, { react: { text: '⌛', key: m.key } })

            // Fetch gambar (ArrayBuffer)
            const response = await axios.get(apiUrl, { responseType: 'arraybuffer' })
            const buffer = Buffer.from(response.data)

            // Kirim gambar langsung dari Buffer (Tanpa simpan file temp agar lebih cepat & aman)
            await sock.sendMessage(m.key.remoteJid, {
                image: buffer,
                caption: 'MAKE DOANG GAK DONASI!' // Caption sesuai request
            }, { quoted: m })

            // Kirim reaksi sukses
            await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } })

        } catch (err) {
            console.error(err)
            sock.sendMessage(m.key.remoteJid, { text: `❌ Terjadi kesalahan: ${err.message}` }, { quoted: m })
        }
    }
}
//ig: elyas_tzy
