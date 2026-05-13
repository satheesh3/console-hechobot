import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../admin-users/admin-user.model';
import { CreateAdminDto, LoginDto } from './dto/login.dto';

@Injectable()
export class AdminAuthService {
  constructor(
    @InjectModel(AdminUser) private readonly adminUsers: typeof AdminUser,
    private readonly jwt: JwtService,
  ) {}

  async createAdmin(dto: CreateAdminDto): Promise<AdminUser> {
    const existing = await this.adminUsers.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Admin already exists');
    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.adminUsers.create({
      email: dto.email,
      passwordHash,
      name: dto.name ?? null,
    } as AdminUser);
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; admin: { id: string; email: string } }> {
    const user = await this.adminUsers.findOne({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email });
    return { accessToken, admin: { id: user.id, email: user.email } };
  }
}
