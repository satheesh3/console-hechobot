import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard, type AuthenticatedClientRequest } from '../../common/guards/api-key.guard';
import {
  CreateWebhookSubscriptionDto,
  UpdateWebhookSubscriptionDto,
} from './dto/webhook-subscription.dto';
import { WebhookSubscriptionsService } from './webhook-subscriptions.service';

@UseGuards(ApiKeyGuard)
@Controller('v1/webhook-subscriptions')
export class WebhookSubscriptionsController {
  constructor(private readonly subs: WebhookSubscriptionsService) {}

  @Post()
  create(@Req() req: AuthenticatedClientRequest, @Body() dto: CreateWebhookSubscriptionDto) {
    return this.subs.create(req.clientContext.client.id, dto);
  }

  @Get()
  list(@Req() req: AuthenticatedClientRequest) {
    return this.subs.listForClient(req.clientContext.client.id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedClientRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWebhookSubscriptionDto,
  ) {
    return this.subs.update(req.clientContext.client.id, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedClientRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.subs.remove(req.clientContext.client.id, id);
  }
}
