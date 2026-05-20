import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChannelsService } from '../channels/channels.service';
import type { Client } from '../clients/client.model';
import { YcloudService, YcloudSendMessageRequest } from '../ycloud/ycloud.service';
import { MessageLog } from './message-log.model';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    @InjectModel(MessageLog) private readonly logs: typeof MessageLog,
    private readonly channels: ChannelsService,
    private readonly ycloud: YcloudService,
  ) {}

  async send(client: Client, dto: SendMessageDto): Promise<MessageLog> {
    if (dto.idempotencyKey) {
      const prior = await this.logs.findOne({
        where: { clientId: client.id, idempotencyKey: dto.idempotencyKey },
      });
      if (prior) return prior;
    }

    const channel = await this.resolveChannel(client.id, dto);
    if (channel.status !== 'active') {
      throw new ForbiddenException(`Channel ${channel.id} is ${channel.status}`);
    }

    if (dto.type === 'text' && !dto.text) {
      throw new BadRequestException('text body required for type=text');
    }
    if (dto.type === 'template' && !dto.template) {
      throw new BadRequestException('template body required for type=template');
    }

    const log = await this.logs.create({
      clientId: client.id,
      channelId: channel.id,
      direction: 'outbound',
      toPhone: dto.to,
      fromPhone: channel.displayPhoneNumber,
      type: dto.type,
      idempotencyKey: dto.idempotencyKey ?? null,
      status: 'queued',
      payload: { ...dto, channelId: channel.id },
    } as MessageLog);

    const providerPayload: YcloudSendMessageRequest = {
      from: channel.displayPhoneNumber,
      to: dto.to,
      type: dto.type,
      ...(dto.text ? { text: { body: dto.text.body, previewUrl: dto.text.previewUrl } } : {}),
      ...(dto.template
        ? {
            template: {
              name: dto.template.name,
              language: { code: dto.template.language.code },
              components: dto.template.components,
            },
          }
        : {}),
    };

    try {
      const res = await this.ycloud.sendMessage(providerPayload);
      const providerMessageId =
        (res?.wamid as string | undefined) ??
        (res?.id as string | undefined) ??
        ((res?.messages as Array<{ id?: string }> | undefined)?.[0]?.id ?? null);
      await log.update({
        status: 'sent',
        providerMessageId: providerMessageId ?? null,
        providerResponse: res,
      });
      return log;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Send failed for client=${client.id}: ${message}`);
      await log.update({
        status: 'failed',
        errorMessage: message,
      });
      throw err;
    }
  }

  list(clientId: string, limit = 50): Promise<MessageLog[]> {
    return this.logs.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']],
      limit: Math.min(limit, 200),
    });
  }

  async get(clientId: string, id: string): Promise<MessageLog> {
    const log = await this.logs.findOne({ where: { clientId, id } });
    if (!log) throw new NotFoundException('Message not found');
    return log;
  }

  private async resolveChannel(clientId: string, dto: SendMessageDto) {
    if (dto.channelId) {
      return this.channels.get(clientId, dto.channelId);
    }
    if (dto.fromPhoneNumberId) {
      const ch = await this.channels.findByPhoneNumberId(dto.fromPhoneNumberId);
      if (!ch || ch.clientId !== clientId) {
        throw new NotFoundException('No channel matches fromPhoneNumberId for this client');
      }
      return ch;
    }
    // Fall back to the client's only channel if there's exactly one.
    const channels = await this.channels.listForClient(clientId);
    if (channels.length === 1) return channels[0];
    throw new BadRequestException(
      'Specify channelId or fromPhoneNumberId — client has multiple channels',
    );
  }
}
