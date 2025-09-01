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
          const message = ctx.message;
          const isValid =
            message.photo !== undefined &&
            message.media_group_id === undefined &&
            message.caption !== undefined &&
            message.caption.length < 300;

          if (isValid) {
            console.log(`Valid submission from userId: ${ctx.from.id}`);
          } else {
            await ctx.api.forwardMessage(ctx.from.id, ctx.chat.id, message.message_id);

            const rules = `Your submission to the #submissions topic was invalid. Please follow these rules:\n- You must submit exactly one image.\n- The image must have a description less than 300 characters.`;
            await ctx.api.sendMessage(ctx.from.id, rules);
            await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
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
