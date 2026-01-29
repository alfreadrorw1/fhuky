const fs = require('fs')

module.exports = {
    name: "Save Kontak Group",
    command: ["savekontak", "savemember", "sv"],
    noPrefix: false,
    owner: true,
    execute: async (sock, m, { args, isOwner }) => {
        try {
            if (!isOwner) return m.reply("❌ Fitur khusus Owner.")

            // Tentukan target grup (dari args atau grup saat ini)
            let targetGroup = m.key.remoteJid
            if (args[0] && args[0].includes('@g.us')) {
                targetGroup = args[0]
            }

            if (!targetGroup.endsWith('@g.us')) {
                return m.reply("⚠️ Gunakan fitur ini di dalam grup atau masukkan ID Group valid!")
            }

            await sock.sendMessage(m.key.remoteJid, { react: { text: "⏳", key: m.key } })

            // Ambil Metadata
            const metadata = await sock.groupMetadata(targetGroup)
            const participants = metadata.participants
            
            // Nama dasar untuk kontak
            const baseName = "Vanzy" 
            let vcardContent = ""
            let count = 0

            // Loop semua member
            for (let member of participants) {
                // Jangan save nomor bot sendiri
                const botNumber = sock.user.id.split(':')[0] + "@s.whatsapp.net"
                if (member.id === botNumber) continue

                // Format nomor
                const phone = member.id.split('@')[0]
                const name = `${baseName} ${count + 1}`

                // Buat format VCard 3.0
                vcardContent += `BEGIN:VCARD\n`
                vcardContent += `VERSION:3.0\n`
                vcardContent += `FN:${name}\n`
                vcardContent += `TEL;type=CELL;type=VOICE;waid=${phone}:+${phone}\n`
                vcardContent += `END:VCARD\n`
                
                count++
            }

            // Simpan ke file sementara
            const fileName = `Kontak_${metadata.subject.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`
            const pathFile = `./${fileName}`
            fs.writeFileSync(pathFile, vcardContent.trim())

            // Kirim file VCF ke user
            await sock.sendMessage(m.key.remoteJid, { 
                document: fs.readFileSync(pathFile), 
                mimetype: 'text/vcard',
                fileName: fileName,
                caption: `✅ *BERHASIL MEMBUAT DATA KONTAK*\n\n📂 Group: ${metadata.subject}\n👥 Total: ${count} Kontak\n🔖 Nama: ${baseName} 1 - ${count}\n\n_Silahkan buka file ini dan pilih 'Import' untuk menyimpan semua kontak sekaligus._`
            }, { quoted: m })

            // Hapus file sampah
            fs.unlinkSync(pathFile)

        } catch (e) {
            console.error(e)
            m.reply("❌ Gagal mengambil kontak grup. Pastikan bot adalah Admin atau ID Group benar.")
        }
    }
}
