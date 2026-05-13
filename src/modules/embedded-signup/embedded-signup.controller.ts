import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminJwtGuard } from '../../common/guards/admin-jwt.guard';
import { EmbeddedSignupCallbackDto } from './embedded-signup.dto';
import { EmbeddedSignupService } from './embedded-signup.service';

// In v1 the Embedded Signup callback is admin-authenticated: the front-end
// (your hosted signup page) collects the Meta phone_number_id + waba_id from
// the Embedded Signup SDK, then POSTs them here with an admin token. Once we
// implement YCloud's direct partner callback, this can be split into a
// signed-public endpoint for YCloud-originated callbacks.
@UseGuards(AdminJwtGuard)
@Controller('admin/embedded-signup')
export class EmbeddedSignupController {
  constructor(private readonly service: EmbeddedSignupService) {}

  @Post('callback')
  callback(@Body() dto: EmbeddedSignupCallbackDto) {
    return this.service.onSignup(dto);
  }
}
