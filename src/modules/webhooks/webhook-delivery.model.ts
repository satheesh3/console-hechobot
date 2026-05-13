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
import { WebhookEvent } from './webhook-event.model';
import { WebhookSubscription } from './webhook-subscription.model';

export type DeliveryStatus = 'pending' | 'in_flight' | 'delivered' | 'failed';

@Table({ tableName: 'webhook_deliveries', underscored: true })
export class WebhookDelivery extends Model<WebhookDelivery> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => WebhookSubscription)
  @Column({ type: DataType.UUID, allowNull: false })
  declare subscriptionId: string;

  @BelongsTo(() => WebhookSubscription)
  declare subscription: WebhookSubscription;

  @ForeignKey(() => WebhookEvent)
  @Column({ type: DataType.UUID, allowNull: false })
  declare eventId: string;

  @BelongsTo(() => WebhookEvent)
  declare event: WebhookEvent;

  @Default('pending')
  @Index
  @Column({
    type: DataType.ENUM('pending', 'in_flight', 'delivered', 'failed'),
    allowNull: false,
  })
  declare status: DeliveryStatus;

  @Default(0)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare attemptCount: number;

  @Index
  @Column({ type: DataType.DATE, allowNull: true })
  declare nextAttemptAt: Date | null;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare lastStatusCode: number | null;

  @Column({ type: DataType.TEXT, allowNull: true })
  declare lastError: string | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
