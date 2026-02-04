---
File          : README
Author        : KevinM6
Date Created  : 01 Feb 2026, 10:39
Last Modified : 04 Feb 2026, 16:03
---

# Telegram Audio Bot

<!--toc:start-->
- [Telegram Audio Bot](#telegram-audio-bot)
<!--toc:end-->

---

This is the **Cloudflare** [worker](https://developers.cloudflare.com/workers-ai/) version of [this Bot](https://github.com/kevinm6/audioToText-bot).  

The main difference is that this is based on [Webhook](https://core.telegram.org/bots/webhooks)
instead of continuous polling, and it's using [whisper](https://developers.cloudflare.com/workers-ai/models/whisper/) instead of *Google*.  

## Code Transparency & Verification

To ensure that the code running on *Cloudflare Workers* matches the source code in this *repository*, you can use the `/verifysha256` command within the bot.  
This returns the **SHA-256 hash** of the `src/index.ts` file generated at the moment of deployment. You can verify this independently by cloning the repository and running:

```bash
npm run verify-sha256
# or directly from root folder
sha256sum src/index.ts
```

If the hash provided by the **Bot** matches your local output, you have mathematical certainty that the deployed logic is identical to the public source code, ensuring no hidden modifications or data logging have been added.

