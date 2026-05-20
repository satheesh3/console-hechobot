import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { ApiKeyGuard, type AuthenticatedClientRequest } from '../../common/guards/api-key.guard';
import { ChannelsService } from './channels.service';
import { CreateChannelDto, UpdateChannelStatusDto } from './dto/channel.dto';

@UseGuards(AdminJwtGuard)
@Controller('admin/clients/:clientId/channels')
export class AdminChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Post()
  upsert(@Param('clientId', ParseUUIDPipe) clientId: string, @Body() dto: CreateChannelDto) {
    return this.channels.upsertForClient(clientId, dto);
  }

  @Get()
  list(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.channels.listForClient(clientId);
  }

  @Patch(':channelId/status')
  setStatus(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('channelId', ParseUUIDPipe) channelId: string,
    @Body() dto: UpdateChannelStatusDto,
  ) {
    return this.channels.setStatus(clientId, channelId, dto);
  }
}

@UseGuards(ApiKeyGuard)
@Controller('v1/channels')
export class ClientChannelsController {
  constructor(private readonly channels: ChannelsService) {}

  @Get()
  list(@Req() req: AuthenticatedClientRequest) {
    return this.channels.listForClient(req.clientContext.client.id);
  }
}
