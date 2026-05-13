import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/sequelize';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminUser } from '../../admin-users/admin-user.model';

export interface AdminJwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    config: ConfigService,
    @InjectModel(AdminUser) private readonly adminUsers: typeof AdminUser,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('adminJwt.secret') ?? 'change-me',
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminUser> {
    const user = await this.adminUsers.findByPk(payload.sub);
    if (!user) throw new UnauthorizedException('Admin user not found');
    return user;
  }
}
