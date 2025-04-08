const { Boom } = require("@hapi/boom");
const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const axios = require("axios");
const mime = require("mime-types");
const fs = require("fs");

const webhookUrl = "https://marivaldo1990.app.n8n.cloud/webhook-test/assistente-juridico-audio";

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth_info");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        printQRInTerminal: true,
        auth: state
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type !== "notify") return;

        for (let msg of messages) {
            if (!msg.message || msg.key.fromMe) return;

            const sender = msg.key.remoteJid;
            const messageType = Object.keys(msg.message)[0];

            const payload = {
                sender,
                messageType,
                content: msg.message[messageType]
            };

            try {
                await axios.post(webhookUrl, payload);
                console.log("Enviado ao webhook:", payload);
            } catch (err) {
                console.error("Erro ao enviar para o webhook:", err.message);
            }
        }
    });
}

startBot();