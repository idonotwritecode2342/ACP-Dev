# Agentic Commerce Gateway

A Next.js 15 project that exposes a unified Agentic Commerce Gateway for merchants. The gateway normalizes WooCommerce product feeds and orchestrates checkout flows for both the Agentic Commerce Protocol (ACP) and the Agent Payments Protocol (AP2), giving merchants a single integration surface that reaches the OpenAI and Google agent ecosystems.

## 🧱 Project Structure

```
agentic-gateway/
├── app/
│   ├── api/
│   │   ├── acp/
│   │   │   ├── checkout/route.ts      # ACP checkout handler
│   │   │   ├── feed/[merchantId]/     # ACP product feed JSON
│   │   │   └── webhook/route.ts       # Stripe delegated payment webhook
│   │   ├── ap2/
│   │   │   ├── checkout/route.ts      # AP2 checkout handler
│   │   │   ├── feed/[merchantId]/     # AP2 product feed JSON
│   │   │   └── webhook/route.ts       # AP2 payment confirmations
│   │   └── unify/
│   │       ├── orders/route.ts        # Unified checkout dispatch
│   │       └── products/route.ts      # WooCommerce → ACP/AP2 mapping
│   └── (dashboard)/                   # Merchant UI (placeholder)
├── lib/
│   ├── acp.ts                         # ACP schema helpers
│   ├── ap2.ts                         # AP2 schema helpers
│   ├── db.ts                          # Prisma client
│   ├── payments.ts                    # Protocol-aware order orchestration
│   ├── stripe.ts                      # Stripe Shared Payment Token helpers
│   └── woocommerce.ts                 # WooCommerce REST client
├── prisma/
│   └── schema.prisma                  # Merchant/product/order data models
├── public/
│   └── ...
├── package.json
└── railway.toml (configure deployment)
```

## 🚀 Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS 4, shadcn/ui, Radix primitives
- **Database**: PostgreSQL with Prisma Client
- **Payments**: Stripe Shared Payment Token (ACP) + delegated payment webhooks
- **Merchant Source**: WooCommerce REST API normalization
- **Deployment**: Railway (Next.js service + managed Postgres)

## 🔌 API Surface

| Endpoint | Description |
| --- | --- |
| `GET /api/acp/feed/:merchantId` | Returns ACP-compliant product feed for a merchant. |
| `POST /api/acp/checkout` | Accepts ACP checkout payloads and creates delegated payment orders via Stripe SPT. |
| `POST /api/acp/webhook` | Stripe webhook handling order authorization updates. |
| `GET /api/ap2/feed/:merchantId` | Returns AP2-compliant product feed. |
| `POST /api/ap2/checkout` | Accepts AP2 delegated payment intents and records unified orders. |
| `POST /api/ap2/webhook` | Receives AP2 payment confirmations and updates order status. |
| `GET /api/unify/products?merchantId=` | Reads normalized WooCommerce products with ACP/AP2 projections. |
| `POST /api/unify/products` | Pulls products from WooCommerce and caches normalized records. |
| `POST /api/unify/orders` | Dispatches checkout requests to ACP or AP2 flows from a single entry point. |

## 🗄️ Database Schema

The Prisma schema tracks merchants, their products, and protocol-specific orders. Run `npx prisma db push` once environment variables are configured.

```prisma
model Merchant {
  id        String   @id @default(cuid())
  name      String
  platform  String
  acpKeys   Json?
  ap2Keys   Json?
  products  Product[]
  orders    Order[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Product {
  id          String   @id @default(cuid())
  merchantId  String
  merchant    Merchant @relation(fields: [merchantId], references: [id])
  name        String
  sku         String?
  price       Float
  currency    String   @default("USD")
  stock       Int?
  formatACP   Json?
  formatAP2   Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Order {
  id         String   @id @default(cuid())
  merchantId String
  merchant   Merchant @relation(fields: [merchantId], references: [id])
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  protocol   Protocol
  status     OrderStatus
  externalId String?
  amount     Float
  currency   String   @default("USD")
  metadata   Json?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

enum Protocol {
  ACP
  AP2
}

enum OrderStatus {
  PENDING
  AUTHORIZED
  CAPTURED
  FAILED
  CANCELED
}
```

## 🔐 Environment Variables

```
DATABASE_URL=...
STRIPE_API_KEY=...
ACP_SIGNING_KEY=...
AP2_PARTNER_KEY=...
WOOCOMMERCE_API_KEY=...
WOOCOMMERCE_API_SECRET=...
```

## 📚 Required Reading

- **Agentic Commerce Protocol (OpenAI + Stripe)**
  - https://developers.openai.com/commerce
  - https://developers.openai.com/commerce/specs/feed
  - https://developers.openai.com/commerce/specs/checkout
  - https://developers.openai.com/commerce/specs/payment
  - https://developers.openai.com/commerce/guides/key-concepts
- **Agent Payments Protocol (AP2)**
  - https://ap2.dev
  - https://github.com/AP2-protocol/specs
  - https://ap2.dev/partners
- **WooCommerce REST API**
  - https://woocommerce.github.io/woocommerce-rest-api-docs/
  - https://woocommerce.github.io/woocommerce-rest-api-docs/#authentication
- **Stripe Shared Payment Tokens**
  - https://stripe.com/blog/agentic-commerce
  - https://docs.stripe.com/payments/agentic-commerce/shared-payment-token
- **Deployment**
  - https://docs.railway.app/
  - https://nextjs.org/docs/app
  - https://ui.shadcn.com

## 🚢 Deployment on Railway

Refer to [docs/railway-deployment.md](docs/railway-deployment.md) for the full CLI runbook. At a high level:

1. Provision a Next.js service and a Postgres database.
2. Set the environment variables above for the web service.
3. Run database migrations with `npx prisma db push`.
4. Deploy – Railway will build the Next.js app and expose `/api/acp/*` and `/api/ap2/*` endpoints.

---

With these conventions in place, any engineer can extend the gateway to onboard additional merchant platforms or agent ecosystems while reusing the same normalization and checkout orchestration layers.
