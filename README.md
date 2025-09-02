# Subonlybot

This is a Telegram bot that enforces submission rules in a specific forum topic.

## Deployment

Follow these steps to deploy the bot:

### 1. Install Dependencies

```bash
npm install
```

### 2. Create KV Namespace

This bot uses a KV namespace to store topic data. Create it by running:

```bash
npx wrangler kv namespace create "TOPIC_DATA"
```

This command will output an `id` and a `preview_id`.

### 3. Configure `wrangler.toml`

Open the `wrangler.toml` file and add the `id` and `preview_id` from the previous step to the `[[kv_namespaces]]` section:

```toml
[[kv_namespaces]]
binding = "TOPIC_DATA"
id = "your-id-here"
preview_id = "your-preview-id-here"
```

### 4. Set Secrets

The bot requires the following secrets:

*   `BOT_TOKEN`: Your Telegram bot token.
*   `SECRET_TOKEN`: A secret token for webhook verification.

Set them using the following commands:

```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put SECRET_TOKEN
```

### 5. Configure Environment Variables

Open the `wrangler.toml` file and configure the following variables in the `[vars]` section:

* `SUBMISSION_TOPICS`: a comma-separated list of topic names to be considered for submission validation. Defaults to `#submissions`.

### 6. Deploy

Deploy the bot to Cloudflare Workers:

```bash
npx wrangler deploy
```

## Webhook Setup

After deploying the bot, you need to set up the webhook for your Telegram bot. Use the following command, replacing `$BOT_TOKEN`, `$SECRET_TOKEN`, and the `url` with your own values.

```bash
curl -s "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  --data-urlencode "url=https://subonlybot.glexey.workers.dev/" \
  --data "secret_token=$SECRET_TOKEN" \
  --data "drop_pending_updates=true"
```
