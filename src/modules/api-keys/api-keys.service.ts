import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Op } from 'sequelize';
import { ApiKey } from './api-key.model';

export interface IssuedApiKey {
  id: string;
  prefix: string;
  label: string | null;
  // The raw secret. Shown once at creation; never persisted in plaintext.
  secret: string;
}

@Injectable()
export class ApiKeysService {
  constructor(@InjectModel(ApiKey) private readonly apiKeys: typeof ApiKey) {}

  async issue(clientId: string, label?: string): Promise<IssuedApiKey> {
    // Format: wak_live_<32 hex chars> — easy to spot and rotate.
    const raw = crypto.randomBytes(24).toString('hex');
    const secret = `wak_live_${raw}`;
    const prefix = secret.slice(0, 12); // "wak_live_abc"
    const keyHash = await bcrypt.hash(secret, 12);

    const created = await this.apiKeys.create({
      clientId,
      prefix,
      keyHash,
      label: label ?? null,
    } as ApiKey);

    return { id: created.id, prefix, label: created.label, secret };
  }

  listForClient(clientId: string): Promise<ApiKey[]> {
    return this.apiKeys.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['keyHash'] },
    });
  }

  async revoke(clientId: string, keyId: string): Promise<void> {
    const key = await this.apiKeys.findOne({ where: { id: keyId, clientId } });
    if (!key) throw new NotFoundException('API key not found');
    if (key.revokedAt) return;
    await key.update({ revokedAt: new Date() });
  }

  // Used by the ApiKeyGuard. Bcrypt-compares against candidate keys filtered by
  // prefix to keep the comparison set tiny.
  async verifyAndTouch(presentedSecret: string): Promise<ApiKey> {
    if (!presentedSecret.startsWith('wak_')) {
      throw new UnauthorizedException('Invalid API key');
    }
    const prefix = presentedSecret.slice(0, 12);
    const candidates = await this.apiKeys.findAll({
      where: { prefix, revokedAt: { [Op.is]: null } },
    });
    for (const candidate of candidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await bcrypt.compare(presentedSecret, candidate.keyHash)) {
        // Best-effort lastUsedAt update; don't block the request on it.
        candidate.update({ lastUsedAt: new Date() }).catch(() => undefined);
        return candidate;
      }
    }
    throw new UnauthorizedException('Invalid API key');
  }
}
