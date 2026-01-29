const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

module.exports = {
    name: "Sticker Maker",
    command: ["sticker", "s", "stiker"],
    execute: async (sock, m, { args, prefix, command }) => {
        // 1. Cek apakah ada media (Gambar/Video) di pesan ini atau di quote
        const contentType = m.message?.extendedTextMessage?.contextInfo?.quotedMessage || m.message;
        const isImage = contentType?.imageMessage;
        const isVideo = contentType?.videoMessage;
        const isViewOnce = contentType?.viewOnceMessageV2; // Support ViewOnce (Sekali lihat)

        if (!isImage && !isVideo && !isViewOnce) {
            return sock.sendMessage(m.key.remoteJid, { text: `⚠️ Kirim gambar/video dengan caption *${prefix}${command}* atau reply gambar yang sudah ada.` }, { quoted: m });
        }

        // Notifikasi "Sedang membuat..."
        await sock.sendMessage(m.key.remoteJid, { react: { text: "⏳", key: m.key } });

        try {
            // 2. Download Media
            // Logic rumit untuk menangani berbagai tipe pesan (Quoted, ViewOnce, Normal)
            let type = isImage ? 'image' : 'video';
            let messageType = isImage ? contentType.imageMessage : contentType.videoMessage;
            
            // Handle View Once
            if (isViewOnce) {
                const viewOnceMsg = contentType.viewOnceMessageV2.message;
                type = viewOnceMsg.imageMessage ? 'image' : 'video';
                messageType = viewOnceMsg.imageMessage || viewOnceMsg.videoMessage;
            }

            const stream = await downloadContentFromMessage(messageType, type);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            // 3. Simpan File Sementara (Aman untuk Termux/Panel)
            const randomId = Math.floor(Math.random() * 10000);
            const inputPath = path.join(__dirname, `../data/temp_${randomId}.${type === 'image' ? 'jpg' : 'mp4'}`);
            const outputPath = path.join(__dirname, `../data/sticker_${randomId}.webp`);

            // Pastikan folder data ada
            if (!fs.existsSync(path.dirname(inputPath))) fs.mkdirSync(path.dirname(inputPath), { recursive: true });
            
            fs.writeFileSync(inputPath, buffer);

            // 4. Konversi pakai FFMPEG (Logic Inti)
            // Command ini mengubah input jadi WebP ukuran 512x512 (Standard WA)
            let ffmpegCmd = '';
            
            if (type === 'image') {
                // Command untuk Gambar
                ffmpegCmd = `ffmpeg -i "${inputPath}" -vcodec libwebp -filter:v "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse" -loop 0 -ss 00:00:00 -t 00:00:05 -preset default -an -vsync 0 "${outputPath}"`;
                // Simple scale command (Lebih Stabil):
                ffmpegCmd = `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -quality 75 "${outputPath}"`;
            } else {
                // Command untuk Video (Maks 5 detik, resize, dan kompres)
                // Hati-hati, konversi video butuh resource CPU lumayan
                ffmpegCmd = `ffmpeg -i "${inputPath}" -vcodec libwebp -filter:v "scale=512:512:force_original_aspect_ratio=decrease,fps=20,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -loop 0 -ss 00:00:00 -t 00:00:06 -preset default -an -vsync 0 -s 512:512 "${outputPath}"`;
            }

            exec(ffmpegCmd, async (err) => {
                // Hapus file input (biar gak menuhin storage)
                fs.unlinkSync(inputPath);

                if (err) {
                    console.error("FFmpeg Error:", err);
                    await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
                    return sock.sendMessage(m.key.remoteJid, { text: "❌ Gagal konversi! Pastikan FFMPEG terinstall di server." }, { quoted: m });
                }

                // 5. Kirim Sticker
                const stickerBuff = fs.readFileSync(outputPath);
                await sock.sendMessage(m.key.remoteJid, { 
                    sticker: stickerBuff 
                }, { quoted: m });

                // Hapus file output
                fs.unlinkSync(outputPath);
                await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
            });

        } catch (e) {
            console.error(e);
            await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        }
    }
}
