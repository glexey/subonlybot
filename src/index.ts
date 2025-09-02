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
      const groupId = ctx.chat.id;
      if (threadId) {
        await env.TOPIC_DATA.put(`${groupId}_${threadId}`, topicName);
      }
    });

    bot.on("message:is_topic_message", async (ctx) => {
      const threadId = ctx.message.message_thread_id;
      const groupId = ctx.chat.id;
      if (threadId) {
        console.log(`Message from user ${ctx.from.id} in group ${groupId} thread ${threadId}`);
        const topicName = await env.TOPIC_DATA.get(`${groupId}_${threadId}`);
        if (topicName === "#submissions") {
          const message = ctx.message;
          const errors: string[] = [];

          if (message.photo === undefined) {
            errors.push("- Ваше сообщение должно содержать изображение.");
          } else {
            if (message.media_group_id !== undefined) {
              errors.push("- Вы можете прикрепить только одно изображение.");
            }
            if (message.caption === undefined) {
              errors.push("- Изображение должно содержать описание.");
            } else if (message.caption.length <= 120) {
              errors.push("- Описание должно быть длиннее 120 символов.");
            }
          }

          if (errors.length > 0) {
            await ctx.api.forwardMessage(ctx.from.id, ctx.chat.id, message.message_id);

            const errorHeader = `Ваша публикация в топике #submissions нарушает следующие правила:\n`;
            const errorMessage = errorHeader + errors.join("\n");

            await ctx.api.sendMessage(ctx.from.id, errorMessage);
            await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
          } else {
            console.log(`Valid submission from user: ${ctx.from.id}`);
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
