// src/index.ts
import { Bot, webhookCallback } from "grammy";
export interface Env { BOT_TOKEN: string; SECRET_TOKEN?: string; }

export default {
  async fetch(request: Request, env: Env) {
    const bot = new Bot(env.BOT_TOKEN);

    bot.command("start", (ctx) => ctx.reply("Hello from Workers + grammY 👋"));

    // If you want secret verification, pass the SAME value you used in setWebhook:
    const handler = webhookCallback(bot, "cloudflare-mod", {
      secretToken: env.SECRET_TOKEN, // undefined = no check
    });
    return handler(request);
  },
};
