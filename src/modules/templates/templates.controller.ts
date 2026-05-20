import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard, type AuthenticatedClientRequest } from '../../common/guards/api-key.guard';
import { CreateTemplateDto } from './dto/template.dto';
import { TemplatesService } from './templates.service';

@UseGuards(ApiKeyGuard)
@Controller('v1/templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Post()
  submit(@Req() req: AuthenticatedClientRequest, @Body() dto: CreateTemplateDto) {
    return this.templates.submit(req.clientContext.client, dto);
  }

  @Get()
  list(@Req() req: AuthenticatedClientRequest) {
    return this.templates.listForClient(req.clientContext.client.id);
  }

  @Post('refresh')
  refresh(
    @Req() req: AuthenticatedClientRequest,
    @Query('channelId', ParseUUIDPipe) channelId: string,
  ) {
    return this.templates.refresh(req.clientContext.client.id, channelId);
  }

  @Get(':id')
  get(@Req() req: AuthenticatedClientRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.templates.get(req.clientContext.client.id, id);
  }

  @Delete(':id')
  remove(@Req() req: AuthenticatedClientRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.templates.remove(req.clientContext.client, id);
  }
}
