import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard, type AuthenticatedClientRequest } from '../../common/guards/api-key.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesService } from './messages.service';

@UseGuards(ApiKeyGuard)
@Controller('v1/messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  send(@Req() req: AuthenticatedClientRequest, @Body() dto: SendMessageDto) {
    return this.messages.send(req.clientContext.client, dto);
  }

  @Get()
  list(
    @Req() req: AuthenticatedClientRequest,
    @Query('limit') limit?: string,
  ) {
    const n = limit ? Math.max(1, parseInt(limit, 10)) : 50;
    return this.messages.list(req.clientContext.client.id, n);
  }

  @Get(':id')
  get(@Req() req: AuthenticatedClientRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.messages.get(req.clientContext.client.id, id);
  }
}
