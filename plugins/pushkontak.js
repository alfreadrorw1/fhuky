module.exports = {
    name: "Push Kontak Story",
    command: ["pushkontak", "pushmember", "bcgc"],
    noPrefix: false,
    owner: true, // Wajib True
    execute: async (sock, m, { args, prefix, command, isOwner }) => {
        try {
            if (!isOwner) return m.reply("🔒 Fitur ini dilindungi akses khusus Owner.")

            // 1. Parsing Input
            // Format: .pushkontak Pesan | Delay | IDGroup
            const fullText = args.join(" ")
            const params = fullText.split("|")
            
            const messageToSend = params[0]?.trim()
            const delayTime = parseInt(params[1]?.trim()) || 5000 
            const targetGroupId = params[2]?.trim() || (m.key.remoteJid.endsWith("@g.us") ? m.key.remoteJid : null)

            if (!messageToSend || !targetGroupId) {
                return await sock.sendMessage(m.key.remoteJid, { 
                    text: `⚠️ *FORMAT SALAH*\n\nContoh:\n${prefix + command} Assalamualaikum Save Ya | 3000\n\n_Note: Gunakan delay minimal 3000ms._` 
                }, { quoted: m })
            }

            // Indikator Loading
            await sock.sendMessage(m.key.remoteJid, { react: { text: "🚀", key: m.key } })

            // 2. Ambil Metadata Grup
            let groupMetadata
            try {
                groupMetadata = await sock.groupMetadata(targetGroupId)
            } catch (e) {
                return m.reply("❌ ID Group tidak valid atau Bot sudah keluar.")
            }

            const participants = groupMetadata.participants
            const totalMem = participants.length

            await sock.sendMessage(m.key.remoteJid, { 
                text: `🚀 *MEMULAI PUSH KONTAK*\n\n🎯 Target: ${groupMetadata.subject}\n👥 Jumlah: ${totalMem} Member\n⏱️ Delay: ${delayTime}ms\n✨ Mode: Fake Reply Story` 
            }, { quoted: m })

            // 3. Loop Eksekusi
            let success = 0
            
            for (let i = 0; i < totalMem; i++) {
                const member = participants[i]
                const memberId = member.id
                
                // Skip Bot & Owner
                const botNumber = sock.user.id.split(':')[0] + "@s.whatsapp.net"
                if (memberId === botNumber) continue

                try {
                    // --- MEMBUAT FAKE STORY REPLY ---
                    // Trik agar pesan muncul seolah membalas Status target
                    const fakeStatus = {
                        key: {
                            fromMe: false,
                            participant: memberId, // Seolah dari status mereka
                            remoteJid: "status@broadcast" 
                        },
                        message: {
                            imageMessage: {
                                caption: "Anjir lah Bokep Ya itu?", // Pancingan visual
                                jpegThumbnail: null 
                            }
                        }
                    }

                    // --- KIRIM PESAN TEXT BIASA ---
                    await sock.sendMessage(memberId, { 
                        text: messageToSend,
                        contextInfo: {
                            quotedMessage: fakeStatus.message,
                            participant: memberId,
                            stanzaId: "SB-" + Date.now(),
                            remoteJid: "status@broadcast",
                            isForwarded: true,
                            forwardingScore: 999
                        }
                    })

                    success++
                    console.log(`[PUSH] Sent to ${memberId.split('@')[0]} (${i + 1}/${totalMem})`)

                } catch (err) {
                    console.log(`[PUSH] Failed to ${memberId.split('@')[0]}`, err)
                }

                // Delay Custom
                await new Promise(resolve => setTimeout(resolve, delayTime))
            }

            await sock.sendMessage(m.key.remoteJid, { 
                text: `✅ *SELESAI PUSH*\nBerhasil terkirim ke ${success} member.` 
            }, { quoted: m })

        } catch (e) {
            console.error(e)
            m.reply("❌ Error fatal pada push kontak.")
        }
    }
}
