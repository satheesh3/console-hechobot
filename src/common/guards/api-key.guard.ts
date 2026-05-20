import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import type { Request } from 'express';
import { ApiKeysService } from '../../modules/api-keys/api-keys.service';
import { Client } from '../../modules/clients/client.model';

export interface AuthenticatedClientRequest extends Request {
  clientContext: {
    client: Client;
    apiKeyId: string;
  };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly apiKeys: ApiKeysService,
    @InjectModel(Client) private readonly clients: typeof Client,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedClientRequest>();
    const secret = this.extractSecret(req);
    if (!secret) throw new UnauthorizedException('Missing API key');

    const apiKey = await this.apiKeys.verifyAndTouch(secret);
    const client = await this.clients.findByPk(apiKey.clientId);
    if (!client) throw new UnauthorizedException('Client not found');
    if (client.status !== 'active') throw new ForbiddenException('Client suspended');

    req.clientContext = { client, apiKeyId: apiKey.id };
    return true;
  }

  private extractSecret(req: Request): string | null {
    const auth = req.headers['authorization'];
    if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
      return auth.slice(7).trim();
    }
    const headerKey = req.headers['x-api-key'];
    if (typeof headerKey === 'string') return headerKey.trim();
    return null;
  }
}
