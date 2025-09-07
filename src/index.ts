// src/index.ts
import { Bot, webhookCallback, GrammyError } from "grammy";
export interface Env {
  BOT_TOKEN: string;
  SECRET_TOKEN?: string;
  TOPIC_DATA: KVNamespace;
  SUBMISSION_TOPICS?: string;
}

export default {
  async fetch(request: Request, env: Env) {
    const bot = new Bot(env.BOT_TOKEN);
    const submissionTopics = (env.SUBMISSION_TOPICS || "#submissions").split(",");

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
        const userIdentifier = ctx.from.username ? `@${ctx.from.username}` : ctx.from.id;
        console.log(`Message from user ${userIdentifier} in group ${groupId} thread ${threadId}`);
        let topicName = await env.TOPIC_DATA.get(`${groupId}_${threadId}`);

        if (topicName && submissionTopics.includes(topicName)) {
          const message = ctx.message;
          const errors: string[] = [];

          if (message.photo === undefined) {
            errors.push("- Ваше сообщение должно содержать изображение.");
          } else {
            // if (message.media_group_id !== undefined) {
            //   errors.push("- Вы можете прикрепить только одно изображение.");
            // }
            // if (message.caption === undefined) {
            //   errors.push("- Изображение должно содержать описание.");
            // }
          }

          if (errors.length > 0) {
            try {
              // await ctx.api.forwardMessage(ctx.from.id, ctx.chat.id, message.message_id);
              // await ctx.api.sendMessage(ctx.from.id, errorMessage);

              const errorHeader = `Ваша публикация в топике ${topicName} нарушает следующие правила:\n`;
              const errorMessage = errorHeader + errors.join("\n");
              console.log("Deleting message:", errorMessage)
              await ctx.api.deleteMessage(ctx.chat.id, message.message_id);
            } catch (err) {
              if (err instanceof GrammyError) {
                console.error("Telegram API error:", err);
              } else {
                console.error("Unexpected error:", err);
              }
            }
          } else {
            console.log(`Valid submission from user: ${userIdentifier}`);
          }
        }
      }
    });

    bot.on("message", (ctx) => {
      console.log("Unknown message received:", JSON.stringify(ctx.message, null, 2));
    });

    // If you want secret verification, pass the SAME value you used in setWebhook:
    const handler = webhookCallback(bot, "cloudflare-mod", {
      secretToken: env.SECRET_TOKEN, // undefined = no check
    });
    return handler(request);
  },
};
