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
import { WhatsappChannel } from '../channels/whatsapp-channel.model';

export type TemplateStatus = 'pending' | 'approved' | 'rejected' | 'paused' | 'disabled';

@Table({
  tableName: 'message_templates',
  underscored: true,
  indexes: [{ unique: true, fields: ['waba_id', 'name', 'language'] }],
})
export class MessageTemplate extends Model<MessageTemplate> {
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

  @Column({ type: DataType.STRING, allowNull: false })
  declare wabaId: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare language: string;

  @Column({ type: DataType.STRING, allowNull: false })
  declare category: string;

  @Default('pending')
  @Column({
    type: DataType.ENUM('pending', 'approved', 'rejected', 'paused', 'disabled'),
    allowNull: false,
  })
  declare status: TemplateStatus;

  @Column({ type: DataType.JSONB, allowNull: false })
  declare components: unknown[];

  @Column({ type: DataType.JSONB, allowNull: true })
  declare providerMetadata: Record<string, unknown> | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
