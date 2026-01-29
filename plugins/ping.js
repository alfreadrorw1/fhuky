const fs = require("fs")
const path = require("path")

const baseDir = path.join(__dirname, "..", "data", "Uptime")
const uptimeFile = path.join(baseDir, "start.json")

if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true })

if (!fs.existsSync(uptimeFile)) {
    fs.writeFileSync(uptimeFile, JSON.stringify({ start: Date.now() }))
}

const uptimeData = JSON.parse(fs.readFileSync(uptimeFile))
const START_TIME = uptimeData.start

module.exports = {
    name: "ping",
    command: ["ping"],
    owner: true,
    execute: async (sock, msg, { isOwner, body, prefix, command }) => {
        if (!isOwner) return
        if (body.startsWith(prefix + " ")) return

        const configPath = path.join(__dirname, "../config.json")
        const config = JSON.parse(fs.readFileSync(configPath))
        const ownerNumber = config.owner.replace(/[^0-9]/g, '')
        const ownerJid = ownerNumber + "@s.whatsapp.net"

        const start = Date.now()

        const sent = await sock.sendMessage(
            msg.key.remoteJid,
            { text: "> *ᴘɪɴɢɪɴɢ...*" }
        )

        const speed = Date.now() - start
        const latency = Date.now() - Number(msg.messageTimestamp) * 1000

        const uptimeMs = Date.now() - START_TIME

        const d = Math.floor(uptimeMs / (1000 * 60 * 60 * 24))
        const h = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24)
        const m = Math.floor((uptimeMs / (1000 * 60)) % 60)
        const s = Math.floor((uptimeMs / 1000) % 60)
        
        const uptimeString = `${d}.${h}:${m}:${s}`

        const text =
`> ⛧ *ᴘᴏɴɢ:* ${speed}ms
> ⛧ *sᴘᴇᴇᴅ:* ${latency}ms
> ⛧ *ᴜᴘᴛɪᴍᴇ:* ${uptimeString}
> © *ᴏᴡɴᴇʀ:* @${ownerNumber}`

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text,
                edit: sent.key,
                mentions: [ownerJid]
            }
        )
    }
}
