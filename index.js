const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("Conexão encerrada. Reconectar?", shouldReconnect);
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("Conectado com sucesso ao WhatsApp");
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    console.log("Mensagem recebida", JSON.stringify(m, undefined, 2));

    const msg = m.messages[0];
    const texto = msg.message?.conversation;

    if (!msg.key.fromMe && texto) {
      const resposta = `Você disse: "${texto}"`;
      await sock.sendMessage(msg.key.remoteJid, { text: resposta });
    }
  });
}

connectToWhatsApp().catch((err) => console.error("Erro na conexão:", err));

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});