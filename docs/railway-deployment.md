# Railway Deployment Runbook

This runbook captures the exact sequence of commands needed to deploy the Agentic Commerce Gateway to Railway using the provided `railway.toml` configuration. It assumes you already have a Railway account with access to provision services.

## 1. Install the Railway CLI

```bash
npm install -g @railway/cli
railway version
```

> The CLI login flow opens a browser window. If you are running this in a headless environment, use `railway login --browserless` and paste the generated key in the terminal.

## 2. Authenticate and Link the Project

```bash
railway login
# From the repository root
railway link
```

If the project does not exist yet, choose **Create a New Project** and name it `agentic-commerce-gateway`. The CLI will automatically upload the `railway.toml` file so the services defined there are created on Railway.

## 3. Provision the Database Plugin

The gateway requires Postgres. Provision it once and set the resulting connection string on the web service.

```bash
railway plugin add postgresql
railway variables set DATABASE_URL="<postgres-connection-string>"
```

You can retrieve the managed Postgres URL with `railway variables` or by visiting the Railway dashboard and copying the `DATABASE_URL` secret from the plugin tab.

## 4. Configure Protocol Credentials

Set the remaining secrets so the ACP/AP2 checkout flows can reach external services.

```bash
railway variables set \
  STRIPE_API_KEY="sk_live_..." \
  ACP_SIGNING_KEY="acp_..." \
  AP2_PARTNER_KEY="ap2_..." \
  WOOCOMMERCE_API_KEY="ck_..." \
  WOOCOMMERCE_API_SECRET="cs_..."
```

## 5. Apply the Prisma Schema

Once the `DATABASE_URL` is available, push the schema so the `Merchant`, `Product`, and `Order` tables exist before deploying.

```bash
railway run npx prisma db push
```

This runs the command inside the Railway web service container using the configured environment variables.

## 6. Trigger a Deployment

The `railway.toml` file defines a single `web` service that builds with `npm run build` and starts with `npm run start` (which runs `next start`). Deploy using either `railway up` for a one-off build or `railway deploy` to trigger a new deployment based on the current git branch.

```bash
railway up --service web
# or
railway deploy --service web
```

Railway will install dependencies, run `npm run build`, and then launch the Next.js server. After the deployment is healthy, `/api/acp/*` and `/api/ap2/*` endpoints become available on the service domain.

## 7. Verify the Deployment

Use `railway logs --service web` to monitor the Next.js server and confirm that requests succeed. You can also hit the health endpoints directly:

```bash
curl https://<railway-domain>/api/acp/feed/<merchantId>
curl https://<railway-domain>/api/ap2/feed/<merchantId>
```

If the responses include normalized product data, the deployment is configured correctly.

## 8. Continuous Delivery (Optional)

To keep Railway deployments in sync with your main branch, generate a Railway deploy token and store it as `RAILWAY_TOKEN` in your GitHub repository secrets. Then add a GitHub Actions workflow that runs `railway up --service web` on each push. This project does not ship a workflow file by default, but the tokenized workflow is fully supported.
