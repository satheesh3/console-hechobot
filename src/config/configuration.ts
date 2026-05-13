export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: parseInt(process.env.PORT ?? '3000', 10),
    baseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
  },
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_DATABASE ?? 'whatsapp_reseller',
    logging: (process.env.DB_LOGGING ?? 'false') === 'true',
  },
  adminJwt: {
    secret: process.env.ADMIN_JWT_SECRET ?? 'change-me',
    expiresIn: process.env.ADMIN_JWT_EXPIRES_IN ?? '12h',
  },
  ycloud: {
    apiKey: process.env.YCLOUD_API_KEY ?? '',
    baseUrl: process.env.YCLOUD_BASE_URL ?? 'https://api.ycloud.com/v2',
    webhookSecret: process.env.YCLOUD_WEBHOOK_SECRET ?? '',
  },
  webhookDelivery: {
    maxAttempts: parseInt(process.env.WEBHOOK_DELIVERY_MAX_ATTEMPTS ?? '8', 10),
    timeoutMs: parseInt(process.env.WEBHOOK_DELIVERY_TIMEOUT_MS ?? '10000', 10),
  },
});
