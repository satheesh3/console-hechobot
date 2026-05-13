'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

    await queryInterface.createTable('admin_users', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.createTable('clients', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      name: { type: DataTypes.STRING, allowNull: false },
      contact_email: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('active', 'suspended'),
        allowNull: false,
        defaultValue: 'active',
      },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.createTable('api_keys', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onDelete: 'CASCADE',
      },
      prefix: { type: DataTypes.STRING(16), allowNull: false },
      key_hash: { type: DataTypes.STRING, allowNull: false },
      label: { type: DataTypes.STRING, allowNull: true },
      last_used_at: { type: DataTypes.DATE, allowNull: true },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('api_keys', ['key_hash']);
    await queryInterface.addIndex('api_keys', ['prefix']);

    await queryInterface.createTable('whatsapp_channels', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onDelete: 'CASCADE',
      },
      waba_id: { type: DataTypes.STRING, allowNull: false },
      phone_number_id: { type: DataTypes.STRING, allowNull: false, unique: true },
      display_phone_number: { type: DataTypes.STRING, allowNull: false },
      verified_name: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'active', 'disabled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      ycloud_metadata: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('whatsapp_channels', ['client_id']);
    await queryInterface.addIndex('whatsapp_channels', ['waba_id']);

    await queryInterface.createTable('message_logs', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onDelete: 'CASCADE',
      },
      channel_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'whatsapp_channels', key: 'id' },
        onDelete: 'SET NULL',
      },
      direction: { type: DataTypes.ENUM('outbound', 'inbound'), allowNull: false },
      to_phone: { type: DataTypes.STRING, allowNull: false },
      from_phone: { type: DataTypes.STRING, allowNull: true },
      type: { type: DataTypes.STRING, allowNull: false },
      idempotency_key: { type: DataTypes.STRING, allowNull: true },
      provider_message_id: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'received'),
        allowNull: false,
      },
      payload: { type: DataTypes.JSONB, allowNull: false },
      provider_response: { type: DataTypes.JSONB, allowNull: true },
      error_code: { type: DataTypes.STRING, allowNull: true },
      error_message: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('message_logs', ['client_id', 'created_at']);
    await queryInterface.addIndex('message_logs', ['provider_message_id']);
    await queryInterface.addIndex('message_logs', {
      name: 'message_logs_client_id_idempotency_key_unique',
      fields: ['client_id', 'idempotency_key'],
      unique: true,
      where: { idempotency_key: { [Sequelize.Op.ne]: null } },
    });

    await queryInterface.createTable('message_templates', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onDelete: 'CASCADE',
      },
      channel_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'whatsapp_channels', key: 'id' },
        onDelete: 'SET NULL',
      },
      waba_id: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      language: { type: DataTypes.STRING, allowNull: false },
      category: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'paused', 'disabled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      components: { type: DataTypes.JSONB, allowNull: false },
      provider_metadata: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('message_templates', {
      fields: ['waba_id', 'name', 'language'],
      unique: true,
      name: 'message_templates_waba_name_language_unique',
    });

    await queryInterface.createTable('webhook_subscriptions', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onDelete: 'CASCADE',
      },
      url: { type: DataTypes.STRING(2048), allowNull: false },
      signing_secret: { type: DataTypes.STRING, allowNull: false },
      events: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });

    await queryInterface.createTable('webhook_events', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      client_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'clients', key: 'id' },
        onDelete: 'SET NULL',
      },
      type: { type: DataTypes.STRING, allowNull: false },
      provider_event_id: { type: DataTypes.STRING, allowNull: true, unique: true },
      payload: { type: DataTypes.JSONB, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('webhook_events', ['client_id', 'created_at']);
    await queryInterface.addIndex('webhook_events', ['type']);

    await queryInterface.createTable('webhook_deliveries', {
      id: { type: DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      subscription_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'webhook_subscriptions', key: 'id' },
        onDelete: 'CASCADE',
      },
      event_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'webhook_events', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: DataTypes.ENUM('pending', 'in_flight', 'delivered', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      attempt_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      next_attempt_at: { type: DataTypes.DATE, allowNull: true },
      last_status_code: { type: DataTypes.INTEGER, allowNull: true },
      last_error: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
    await queryInterface.addIndex('webhook_deliveries', ['status', 'next_attempt_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('webhook_deliveries');
    await queryInterface.dropTable('webhook_events');
    await queryInterface.dropTable('webhook_subscriptions');
    await queryInterface.dropTable('message_templates');
    await queryInterface.dropTable('message_logs');
    await queryInterface.dropTable('whatsapp_channels');
    await queryInterface.dropTable('api_keys');
    await queryInterface.dropTable('clients');
    await queryInterface.dropTable('admin_users');

    // Drop enums explicitly (Sequelize-cli quirk on Postgres).
    for (const enumName of [
      'enum_clients_status',
      'enum_whatsapp_channels_status',
      'enum_message_logs_direction',
      'enum_message_logs_status',
      'enum_message_templates_status',
      'enum_webhook_deliveries_status',
    ]) {
      await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${enumName}";`);
    }
  },
};
