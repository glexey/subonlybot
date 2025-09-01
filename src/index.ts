// src/index.ts
import { Bot, webhookCallback } from "grammy";
export interface Env {
  BOT_TOKEN: string;
  SECRET_TOKEN?: string;
  TOPIC_DATA: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env) {
    const bot = new Bot(env.BOT_TOKEN);

    bot.command("start", (ctx) => ctx.reply("Hello from Workers + grammY 👋"));

    bot.on("message:forum_topic_created", async (ctx) => {
      const topicName = ctx.message.forum_topic_created.name;
      const threadId = ctx.message.message_thread_id;
      if (threadId) {
        await env.TOPIC_DATA.put(threadId.toString(), topicName);
      }
    });

    bot.on("message:is_topic_message", async (ctx) => {
      const threadId = ctx.message.message_thread_id;
      if (threadId) {
        const topicName = await env.TOPIC_DATA.get(threadId.toString());
        if (topicName === "#submissions") {
          const userId = ctx.from.id;
          const messageText = ctx.message.text;
          if (messageText) {
            console.log(`Sending message to userId: ${userId} in topic: ${topicName}`);
            await ctx.api.sendMessage(userId, messageText);
          }
        }
      }
    });

    // If you want secret verification, pass the SAME value you used in setWebhook:
    const handler = webhookCallback(bot, "cloudflare-mod", {
      secretToken: env.SECRET_TOKEN, // undefined = no check
    });
    return handler(request);
  },
};
