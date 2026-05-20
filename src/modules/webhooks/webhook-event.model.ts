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

// Raw events received from YCloud (pre-fanout). One row per incoming webhook
// after signature verification.
@Table({ tableName: 'webhook_events', underscored: true })
export class WebhookEvent extends Model<WebhookEvent> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: true })
  declare clientId: string | null;

  @BelongsTo(() => Client)
  declare client: Client | null;

  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  declare type: string;

  // YCloud event id if present — for idempotent ingest.
  @Index
  @Column({ type: DataType.STRING, allowNull: true })
  declare providerEventId: string | null;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare payload: Record<string, unknown>;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
