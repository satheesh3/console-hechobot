# WhatsApp API Reseller (NestJS + YCloud)

Multi-tenant backend that lets you resell WhatsApp Business API access on top of
a YCloud BSP connection. Each client signs up via Embedded Signup, brings one
or more of their own phone numbers, and gets a bearer API key to send messages,
manage templates, and receive inbound webhooks routed through your platform.

> v1 is **backend API only**. No client dashboard yet. YCloud credentials are
> stubbed via env vars — see TODOs below.

## Stack

- NestJS 10 (TypeScript)
- Postgres + Sequelize (`@nestjs/sequelize`, `sequelize-typescript`)
- JWT for admin auth, bcrypt-hashed bearer API keys for client auth
- Outbound webhook fan-out with HMAC signing and exponential-backoff retries
  (scheduled via `@nestjs/schedule` — Redis/BullMQ not required for v1)

## Layout

```
src/
  main.ts                    bootstrap, raw-body parser for /webhooks/ycloud
  app.module.ts              composition root
  config/configuration.ts    typed env reader
  database/                  Sequelize wiring + migrations
  common/
    guards/                  ApiKeyGuard (client), AdminJwtGuard (admin)
    decorators/CurrentClient
    filters/AllExceptionsFilter
  modules/
    ycloud/                  thin YCloud HTTP wrapper + webhook signature verify
    admin-auth/              admin login + JWT
    admin-users/             admin user model
    clients/                 admin CRUD for tenant clients
    api-keys/                issue / list / revoke bearer keys
    channels/                WhatsApp numbers (WABA + phone_number_id) per client
    embedded-signup/         callback that records a newly-onboarded number
    messages/                client send + log + status updates
    templates/               client template submit / list / refresh
    webhooks/                YCloud ingress, fan-out delivery, client subscriptions
```

## Setup

```bash
cp .env.example .env       # fill in DB creds + (later) YCloud keys
npm install
npm run db:migrate         # creates all tables
npm run start:dev
```

`GET /health` should return `{ "status": "ok" }`.

### Bootstrapping the first admin

`/admin/auth/admins` requires an existing admin JWT, so you'll need to seed the
first one. Quickest path in dev:

```bash
node -e "(async()=>{const b=require('bcrypt');console.log(await b.hash('changeme1234',12))})()"
# then in psql:
INSERT INTO admin_users (email, password_hash) VALUES ('you@example.com', '<hash>');
```

Then `POST /admin/auth/login` with `{ email, password }` to get a JWT.

## Public API surface

All `/v1/*` endpoints require `Authorization: Bearer <api_key>` (or `X-API-Key:
<api_key>`). Keys are issued by `POST /admin/clients/:clientId/api-keys`.

| Method | Path | Purpose |
|---|---|---|
| GET    | `/v1/channels` | list this client's WhatsApp numbers |
| POST   | `/v1/messages` | send a text or template message |
| GET    | `/v1/messages` | list recent messages |
| GET    | `/v1/messages/:id` | fetch one |
| POST   | `/v1/templates` | submit a template for Meta approval |
| GET    | `/v1/templates` | list templates |
| POST   | `/v1/templates/refresh?channelId=...` | pull latest statuses from YCloud |
| DELETE | `/v1/templates/:id` | delete |
| POST   | `/v1/webhook-subscriptions` | register a callback URL |
| GET    | `/v1/webhook-subscriptions` | list |
| PATCH  | `/v1/webhook-subscriptions/:id` | update url/events/active |
| DELETE | `/v1/webhook-subscriptions/:id` | remove |

### Send a text message

```bash
curl -X POST http://localhost:3000/v1/messages \
  -H "Authorization: Bearer wak_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+14155550123",
    "type": "text",
    "text": { "body": "hello from your reseller" },
    "idempotencyKey": "order-42"
  }'
```

If the client has multiple channels, include `channelId` or `fromPhoneNumberId`.

## Outbound webhook contract

When YCloud sends us an event we record it, normalise it, and POST it to each
active subscription URL. Headers:

- `X-Webhook-Event-Id` — internal event id
- `X-Webhook-Event-Type` — e.g. `message.delivered`, `message.received`
- `X-Webhook-Timestamp` — Unix seconds
- `X-Webhook-Signature` — `t=<ts>,v1=<hex(hmac_sha256(signing_secret, ts + "." + body))>`

Clients should reject deliveries older than ~5 minutes and verify the HMAC
using the `signingSecret` returned at subscription-creation time.

Retries: 8 attempts, exponential backoff starting at 30s, capped at 1h.

## Admin API surface

All under `/admin/*`, JWT-guarded.

| Method | Path |
|---|---|
| POST   | `/admin/auth/login` |
| POST   | `/admin/auth/admins` (creates additional admins) |
| GET/POST/PATCH/DELETE | `/admin/clients[/...]` |
| POST/GET/DELETE | `/admin/clients/:clientId/api-keys[/:keyId]` |
| POST   | `/admin/clients/:clientId/channels` (manual channel registration) |
| GET    | `/admin/clients/:clientId/channels` |
| PATCH  | `/admin/clients/:clientId/channels/:channelId/status` |
| POST   | `/admin/embedded-signup/callback` |

## YCloud webhook ingress

`POST /webhooks/ycloud` — raw body parsed and HMAC-verified against
`YCLOUD_WEBHOOK_SECRET`. Adjust the header name in
`src/modules/ycloud/ycloud.service.ts:verifyWebhookSignature` once we confirm
the real one from the YCloud docs.

## Open TODOs (need real YCloud access to finish)

1. **Verify YCloud webhook signature header + scheme.** Current impl assumes
   `x-ycloud-signature: sha256=<hex>` over the raw body. Likely needs adjusting.
2. **Replace `YcloudService.registerChannel` stub** with the real partner-side
   channel-provisioning call once we have partner credentials.
3. **Field names on send response.** `MessagesService` reads `wamid` / `id` /
   `messages[0].id` defensively — narrow to whatever YCloud actually returns.
4. **Inbound event shape.** `WebhookIngressService.normalise` reads `type`,
   `id`, and `phoneNumberId`/`whatsapp.phoneNumberId`. Confirm against real
   payloads from YCloud and adjust the path it digs the phone-number id from.
5. **Embedded Signup callback origin.** v1 expects your hosted front-end (or
   ops tool) to POST the Meta `phoneNumberId`+`wabaId` collected from Meta's
   Embedded Signup JS SDK. If YCloud exposes a server-to-server callback for
   this, swap the admin-guarded endpoint for a signed public one.
6. **Billing / metering.** Out of scope for v1. The `message_logs` table is the
   source of truth — wire a usage roll-up job when ready.
7. **Bootstrap script** for seeding the first admin user (currently documented
   manual step).

## Local dev tips

- `npm run db:migrate:undo` to roll back the last migration.
- `npm run db:migration:generate -- add-something` to scaffold a new one.
- Set `DB_LOGGING=true` to see SQL in the console.
