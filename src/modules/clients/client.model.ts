import {
  Column,
  CreatedAt,
  DataType,
  Default,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { ApiKey } from '../api-keys/api-key.model';
import { WhatsappChannel } from '../channels/whatsapp-channel.model';
import { WebhookSubscription } from '../webhooks/webhook-subscription.model';

export type ClientStatus = 'active' | 'suspended';

@Table({ tableName: 'clients', underscored: true })
export class Client extends Model<Client> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare contactEmail: string;

  @Default('active')
  @Column({ type: DataType.ENUM('active', 'suspended'), allowNull: false })
  declare status: ClientStatus;

  @Column({ type: DataType.JSONB, allowNull: true })
  declare metadata: Record<string, unknown> | null;

  @HasMany(() => ApiKey)
  declare apiKeys: ApiKey[];

  @HasMany(() => WhatsappChannel)
  declare channels: WhatsappChannel[];

  @HasMany(() => WebhookSubscription)
  declare webhookSubscriptions: WebhookSubscription[];

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
