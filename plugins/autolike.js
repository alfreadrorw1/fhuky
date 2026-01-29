const fs = require('fs');
const path = require('path');

module.exports = {
    name: "Auto Like Status",
    command: ["autolike", "setlike"], // Command untuk setting
    noPrefix: true, // Wajib true agar bisa jalan otomatis tanpa command
    execute: async (sock, m, { args, command, isOwner, prefix }) => {
        const dbPath = path.join(__dirname, '../data/autolike.json');
        
        // 1. Buat Database JSON jika belum ada
        if (!fs.existsSync(path.dirname(dbPath))) {
            fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        }
        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({ enabled: true, emoji: '🔥' }));
        }

        const db = JSON.parse(fs.readFileSync(dbPath));
        const isStatus = m.key.remoteJid === 'status@broadcast';

        // ==========================================
        // LOGIC 1: DETEKSI STATUS BARU (AUTO LIKE)
        // ==========================================
        if (isStatus && !m.key.fromMe) {
            // Jika fitur dimatikan, abaikan
            if (!db.enabled) return;

            // Cegah error loop/spam, beri delay random (2-5 detik) agar terlihat alami
            const delay = Math.floor(Math.random() * 3000) + 2000;

            setTimeout(async () => {
                try {
                    // Kirim Reaksi ke Status
                    await sock.sendMessage('status@broadcast', {
                        react: {
                            text: db.emoji,
                            key: m.key
                        }
                    }, { statusJidList: [m.key.participant] });

                    // Opsional: Print di console biar tau bot kerja
                    console.log(`[AUTO-LIKE] Reacted ${db.emoji} to ${m.key.participant.split('@')[0]}`);
                    
                    // Opsional: Mark as Read (Biar centang biru di dia)
                    // await sock.readMessages([m.key]); 
                } catch (e) {
                    console.error("Gagal Auto Like:", e);
                }
            }, delay);
            return; // Stop disini agar tidak lanjut ke logic command
        }

        // ==========================================
        // LOGIC 2: COMMAND SETTING (KHUSUS OWNER)
        // ==========================================
        if (command === "autolike" || command === "setlike") {
            if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: "❌ Fitur ini khusus Owner!" }, { quoted: m });

            if (!args[0]) {
                return sock.sendMessage(m.key.remoteJid, { 
                    text: `💜 *AUTO LIKE STATUS CONFIG* 💜\n\n` +
                          `📊 *Status:* ${db.enabled ? "✅ ON" : "❌ OFF"}\n` +
                          `🔥 *Current Emoji:* ${db.emoji}\n\n` +
                          `*Cara Pakai:*\n` +
                          `• ${prefix}autolike on (Aktifkan)\n` +
                          `• ${prefix}autolike off (Matikan)\n` +
                          `• ${prefix}autolike 🗿 (Ganti Emoji)`
                }, { quoted: m });
            }

            if (args[0].toLowerCase() === "on") {
                db.enabled = true;
                fs.writeFileSync(dbPath, JSON.stringify(db));
                return sock.sendMessage(m.key.remoteJid, { text: "✅ Auto Like Status BERHASIL DIAKTIFKAN!" }, { quoted: m });
            } else if (args[0].toLowerCase() === "off") {
                db.enabled = false;
                fs.writeFileSync(dbPath, JSON.stringify(db));
                return sock.sendMessage(m.key.remoteJid, { text: "❌ Auto Like Status BERHASIL DIMATIKAN!" }, { quoted: m });
            } else {
                // Anggap argumen adalah emoji baru
                db.emoji = args[0];
                fs.writeFileSync(dbPath, JSON.stringify(db));
                return sock.sendMessage(m.key.remoteJid, { text: `✅ Emoji Auto Like diganti menjadi: ${args[0]}` }, { quoted: m });
            }
        }
    }
}
