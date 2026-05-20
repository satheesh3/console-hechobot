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

@Table({ tableName: 'api_keys', underscored: true })
export class ApiKey extends Model<ApiKey> {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Client)
  @Column({ type: DataType.UUID, allowNull: false })
  declare clientId: string;

  @BelongsTo(() => Client)
  declare client: Client;

  // First 8 chars of the key, shown so clients can identify keys in the UI.
  @Column({ type: DataType.STRING(16), allowNull: false })
  declare prefix: string;

  // bcrypt hash of the full secret. The raw secret is returned exactly once,
  // at issuance time, and never persisted.
  @Index
  @Column({ type: DataType.STRING, allowNull: false })
  declare keyHash: string;

  @Column({ type: DataType.STRING, allowNull: true })
  declare label: string | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare lastUsedAt: Date | null;

  @Column({ type: DataType.DATE, allowNull: true })
  declare revokedAt: Date | null;

  @CreatedAt
  declare createdAt: Date;

  @UpdatedAt
  declare updatedAt: Date;
}
