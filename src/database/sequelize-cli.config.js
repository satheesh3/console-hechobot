// CommonJS config consumed by sequelize-cli (migrations).
// The NestJS runtime reads from src/config/configuration.ts instead.
require('dotenv').config();

const shared = {
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'whatsapp_reseller',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
};

module.exports = {
  development: shared,
  test: { ...shared, database: `${shared.database}_test` },
  production: shared,
};
