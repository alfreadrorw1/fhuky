module.exports = {
    name: "Get Group ID Simple",
    command: ["idgc", "cekidgc"],
    noPrefix: false,
    owner: true, // Khusus Owner
    execute: async (sock, m, { isOwner }) => {
        try {
            if (!isOwner) return m.reply("❌ Fitur ini khusus Owner.")

            await sock.sendMessage(m.key.remoteJid, { react: { text: "📂", key: m.key } })

            // 1. Ambil Data Group
            const groups = await sock.groupFetchAllParticipating()
            const groupList = Object.values(groups)

            if (groupList.length === 0) return m.reply("⚠️ Bot belum masuk ke group manapun.")

            await sock.sendMessage(m.key.remoteJid, { text: `📊 *DITEMUKAN ${groupList.length} GROUP*\nMengirim data ID satu per satu...` }, { quoted: m })

            // 2. Loop Kirim Pesan Teks (Tanpa Button)
            for (let i = 0; i < groupList.length; i++) {
                const g = groupList[i]
                
                const textInfo = `*GROUP ${i + 1} / ${groupList.length}*\n` +
                                 `🏷️ *Nama:* ${g.subject}\n` +
                                 `🆔 *ID:* ${g.id}\n` +
                                 `👥 *Member:* ${g.participants.length}\n` +
                                 `👑 *Owner:* ${g.owner || "Tidak terdeteksi"}\n\n` +
                                 `_Silahkan salin ID di atas secara manual._`

                await sock.sendMessage(m.key.remoteJid, { text: textInfo })

                // Delay 1.5 detik agar pesan masuk berurutan dan tidak spam
                await new Promise(r => setTimeout(r, 1500))
            }

            await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } })
            await sock.sendMessage(m.key.remoteJid, { text: "✅ Selesai mengirim semua ID Group." }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply("❌ Gagal mengambil data group.")
        }
    }
}
