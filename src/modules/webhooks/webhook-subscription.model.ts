import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Client } from '../clients/client.model';

@Table({ tableName: 'webhook_subscriptions', underscored: true })
export class WebhookSubscription extends Model<WebhookSubscription> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  declare clientId: string;

  @BelongsTo(() => Client)
  declare client: Client;

  @Column({ type: DataType.STRING(2048), allowNull: false })
  declare url: string;

  // Secret used to sign outgoing deliveries (HMAC-SHA256) so clients can verify.
  @Column({ type: DataType.STRING, allowNull: false })
  declare signingSecret: string;

  // Event types to deliver. Empty array == subscribe to all.
  @Default([])
  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false })
  declare events: string[];

  @Default(true)
  @Column({ type: DataType.BOOLEAN, allowNull: false })
  declare active: boolean;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
