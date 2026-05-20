import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { ApiKeysService } from './api-keys.service';

class IssueKeyDto {
  @IsOptional()
  @IsString()
  label?: string;
}

@UseGuards(AdminJwtGuard)
@Controller('admin/clients/:clientId/api-keys')
export class ApiKeysController {
  constructor(private readonly keys: ApiKeysService) {}

  @Post()
  issue(@Param('clientId', ParseUUIDPipe) clientId: string, @Body() dto: IssueKeyDto) {
    return this.keys.issue(clientId, dto.label);
  }

  @Get()
  list(@Param('clientId', ParseUUIDPipe) clientId: string) {
    return this.keys.listForClient(clientId);
  }

  @Delete(':keyId')
  revoke(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Param('keyId', ParseUUIDPipe) keyId: string,
  ) {
    return this.keys.revoke(clientId, keyId);
  }
}
