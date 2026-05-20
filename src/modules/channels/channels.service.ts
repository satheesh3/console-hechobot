import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhatsappChannel } from './whatsapp-channel.model';
import { CreateChannelDto, UpdateChannelStatusDto } from './dto/channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    @InjectModel(WhatsappChannel) private readonly channels: typeof WhatsappChannel,
  ) {}

  async upsertForClient(clientId: string, dto: CreateChannelDto): Promise<WhatsappChannel> {
    const existing = await this.channels.findOne({ where: { phoneNumberId: dto.phoneNumberId } });
    if (existing && existing.clientId !== clientId) {
      throw new ConflictException('Phone number already registered to a different client');
    }
    if (existing) {
      await existing.update({
        wabaId: dto.wabaId,
        displayPhoneNumber: dto.displayPhoneNumber,
        verifiedName: dto.verifiedName ?? existing.verifiedName,
        ycloudMetadata: dto.ycloudMetadata ?? existing.ycloudMetadata,
      });
      return existing;
    }
    return this.channels.create({
      clientId,
      wabaId: dto.wabaId,
      phoneNumberId: dto.phoneNumberId,
      displayPhoneNumber: dto.displayPhoneNumber,
      verifiedName: dto.verifiedName ?? null,
      ycloudMetadata: dto.ycloudMetadata ?? null,
    } as WhatsappChannel);
  }

  listForClient(clientId: string): Promise<WhatsappChannel[]> {
    return this.channels.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']],
    });
  }

  async get(clientId: string, channelId: string): Promise<WhatsappChannel> {
    const c = await this.channels.findOne({ where: { id: channelId, clientId } });
    if (!c) throw new NotFoundException('Channel not found');
    return c;
  }

  async findByPhoneNumberId(phoneNumberId: string): Promise<WhatsappChannel | null> {
    return this.channels.findOne({ where: { phoneNumberId } });
  }

  async setStatus(
    clientId: string,
    channelId: string,
    dto: UpdateChannelStatusDto,
  ): Promise<WhatsappChannel> {
    const c = await this.get(clientId, channelId);
    await c.update({ status: dto.status });
    return c;
  }
}
