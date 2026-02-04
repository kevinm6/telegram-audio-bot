export interface Env {
  AI: any;
  BOT_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Bot is active");
    }

    try {
      const update: any = await request.json();
      const message = update.message;

      if (!message) return new Response("OK");

      const chatId = message.chat.id;
      const text = message.text || "";
      const userLang = message.from?.language_code?.split("-")[0] || "en";

      // Handle Commands
      if (text === "/start") {
        const startMessage =
          userLang === "it"
            ? "✅ Bot attivo! Inviami un messaggio vocale/audio e lo trascrivo."
            : "✅ Bot connected! Send me voice/audio message and I transcribe it.";
        await sendMessage(env.BOT_TOKEN, chatId, startMessage);
        return new Response("OK");
      }

      if (text === "/help") {
        await sendMessage(
          env.BOT_TOKEN,
          chatId,
          "🎙 *Audio2Text Bot*\nSend me a voice message and I'll transcribe it using Whisper AI.",
        );
        return new Response("OK");
      }

      if (text === "/verifysha256") {
        // It will be replaced by the real hash string during build/deploy
        const current_hash = typeof DEPLOYED_HASH !== "undefined" ? DEPLOYED_HASH : "development";

        const verifyLabel =
          userLang === "it"
            ? `🔐 **Verifica Trasparenza**\nHash SHA\\-256 del codice sorgente:`
            : `🔐 **Transparency Verification**\nSource code SHA\\-256 Hash:`;
        const escapedHash = escapeMarkdown(current_hash);
        const verifyMessage = `${verifyLabel}\n\n\`${escapedHash}\``;
        await sendMessage(env.BOT_TOKEN, chatId, verifyMessage);
        return new Response("OK");
      }

      // Handle Audio/Voice
      const voice = message.voice || message.audio;
      if (voice) {
        // Capture the status message to delete it later
        const statusMsgResponse = await sendMessage(
          env.BOT_TOKEN,
          chatId,
          "_Transcribing..._",
          message.message_id ?? null,
        );
        const statusMsgData: any = await statusMsgResponse.json();
        const statusMsgId = statusMsgData.result?.message_id;

        // Get File from Telegram
        const fileResponse = await fetch(
          `https://api.telegram.org/bot${env.BOT_TOKEN}/getFile?file_id=${voice.file_id}`,
        );
        const fileData: any = await fileResponse.json();
        const filePath = fileData.result.file_path;

        // Download Audio
        const audioResponse = await fetch(
          `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${filePath}`,
        );
        const audioBlob = await audioResponse.arrayBuffer();

        // Run Whisper AI
        const aiResponse: any = await env.AI.run("@cf/openai/whisper", {
          audio: [...new Uint8Array(audioBlob)],
          language: userLang,
        });

        const errorTranscription =
          userLang === "it"
            ? "⚠️ Non posso trascrivere l'audio."
            : "⚠️ Could not transcribe audio.";
        const transcription = aiResponse.text ?? errorTranscription;
        const escapedTranscription = escapeMarkdown(transcription);
        await sendMessage(
          env.BOT_TOKEN,
          chatId,
          `🎙 \`${escapedTranscription}\``,
          message.message_id,
        );

        // Cleanup: delete status message ("Transcribing...")
        await fetch(
          `https://api.telegram.org/bot${env.BOT_TOKEN}/deleteMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, message_id: statusMsgId }),
          },
        );
      }

      return new Response("OK");
    } catch (e: any) {
      console.error(e);
      return new Response("OK"); // Still return OK to avoid Telegram retry loops
    }
  },
};

async function sendMessage(
  token: string,
  chatId: number,
  text: string,
  replyId?: number,
) {
  // Check Markdown
  const isFormatted = text.includes('`') || text.includes('_') || text.includes('*');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: isFormatted ? "MarkdownV2" : undefined,
      reply_to_message_id: replyId,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Telegram send error:\n", errorBody);
  }
  
  return res;
}

function escapeMarkdown(text: string) {
  return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");
}
