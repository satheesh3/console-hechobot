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
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { Client } from '../clients/client.model';

export type ChannelStatus = 'pending' | 'active' | 'disabled';

@Table({ tableName: 'whatsapp_channels', underscored: true })
export class WhatsappChannel extends Model<WhatsappChannel> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  declare clientId: string;

  @BelongsTo(() => Client)
  declare client: Client;

  // Meta WhatsApp Business Account ID.
  @Column({ type: DataType.STRING, allowNull: false })
  declare wabaId: string;

  // Meta phone_number_id (used to address sends to a specific number).
  @Unique
  @Column({ type: DataType.STRING, allowNull: false })
  declare phoneNumberId: string;

  // E.164 formatted display number, e.g. +14155550123.
  @Column({ type: DataType.STRING, allowNull: false })
  declare displayPhoneNumber: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare verifiedName: string | null;

  @Default('pending')
  @Column({ type: DataType.ENUM('pending', 'active', 'disabled'), allowNull: false })
  declare status: ChannelStatus;

  // Anything we want to remember from YCloud's onboarding response.
  @Column({ type: DataType.JSONB, allowNull: true })
  declare ycloudMetadata: Record<string, unknown> | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
