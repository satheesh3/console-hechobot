import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { AdminAuthService } from './admin-auth.service';
import { CreateAdminDto, LoginDto } from './dto/login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  // Bootstrap-only: protected by admin JWT once at least one admin exists.
  // For the very first admin, run scripts/seed-admin.ts (TODO) or call this
  // endpoint from a trusted shell with admin auth disabled in dev.
  @UseGuards(AdminJwtGuard)
  @Post('admins')
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.auth.createAdmin(dto);
  }
}
