import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthenticatedClientRequest } from '../guards/api-key.guard';
import type { Client } from '../../modules/clients/client.model';

export const CurrentClient = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Client => {
    const req = ctx.switchToHttp().getRequest<AuthenticatedClientRequest>();
    return req.clientContext.client;
  },
);
