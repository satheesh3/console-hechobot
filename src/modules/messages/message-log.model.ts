import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Client } from '../clients/client.model';
import { WhatsappChannel } from '../channels/whatsapp-channel.model';

export type MessageDirection = 'outbound' | 'inbound';
export type MessageStatus =
  | 'queued'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'received';

@Table({ tableName: 'message_logs', underscored: true })
export class MessageLog extends Model<MessageLog> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  declare clientId: string;

  @BelongsTo(() => Client)
  declare client: Client;

  @ForeignKey(() => WhatsappChannel)
  @Column({ type: DataType.UUID, allowNull: true })
  declare channelId: string | null;

  @BelongsTo(() => WhatsappChannel)
  declare channel: WhatsappChannel | null;

  @Column({ type: DataType.ENUM('outbound', 'inbound'), allowNull: false })
  declare direction: MessageDirection;

  @Column({ type: DataType.STRING, allowNull: false })
  declare toPhone: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare fromPhone: string | null;

  @Column({ type: DataType.STRING, allowNull: false })
  declare type: string;

  // Idempotency: per-client unique key clients can send to dedupe retries.
  @Index
  @Column({ type: DataType.STRING, allowNull: true })
  declare idempotencyKey: string | null;

  // YCloud-assigned id (also the wamid we report back to clients).
  @Index
  @Column({ type: DataType.STRING, allowNull: true })
  declare providerMessageId: string | null;

  @Column({ type: DataType.ENUM('queued', 'sent', 'delivered', 'read', 'failed', 'received'), allowNull: false })
  declare status: MessageStatus;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare payload: Record<string, unknown>;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare providerResponse: Record<string, unknown> | null;

  @Column({ type: DataType.STRING, allowNull: true })
  declare errorCode: string | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare errorMessage: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
