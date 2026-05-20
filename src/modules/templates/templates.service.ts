import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ChannelsService } from '../channels/channels.service';
import type { Client } from '../clients/client.model';
import { YcloudService } from '../ycloud/ycloud.service';
import { CreateTemplateDto } from './dto/template.dto';
import { MessageTemplate } from './template.model';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectModel(MessageTemplate) private readonly templates: typeof MessageTemplate,
    private readonly channels: ChannelsService,
    private readonly ycloud: YcloudService,
  ) {}

  async submit(client: Client, dto: CreateTemplateDto): Promise<MessageTemplate> {
    const channel = await this.channels.get(client.id, dto.channelId);

    const providerRes = await this.ycloud.createTemplate({
      wabaId: channel.wabaId,
      name: dto.name,
      category: dto.category,
      language: dto.language,
      components: dto.components,
    });

    const [template] = await this.templates.upsert({
      clientId: client.id,
      channelId: channel.id,
      wabaId: channel.wabaId,
      name: dto.name,
      language: dto.language,
      category: dto.category,
      status: ((providerRes.status as string) ?? 'pending').toLowerCase() as never,
      components: dto.components,
      providerMetadata: providerRes,
    } as MessageTemplate);

    return template;
  }

  listForClient(clientId: string): Promise<MessageTemplate[]> {
    return this.templates.findAll({
      where: { clientId },
      order: [['createdAt', 'DESC']],
    });
  }

  async get(clientId: string, id: string): Promise<MessageTemplate> {
    const t = await this.templates.findOne({ where: { id, clientId } });
    if (!t) throw new NotFoundException('Template not found');
    return t;
  }

  async refresh(clientId: string, channelId: string): Promise<MessageTemplate[]> {
    const channel = await this.channels.get(clientId, channelId);
    const res = await this.ycloud.listTemplates(channel.wabaId);
    const items = (res?.results as Array<Record<string, unknown>> | undefined) ?? [];
    const refreshed: MessageTemplate[] = [];
    for (const item of items) {
      // eslint-disable-next-line no-await-in-loop
      const [row] = await this.templates.upsert({
        clientId,
        channelId,
        wabaId: channel.wabaId,
        name: String(item.name ?? ''),
        language: String(item.language ?? ''),
        category: String(item.category ?? ''),
        status: String(item.status ?? 'pending').toLowerCase() as never,
        components: (item.components as unknown[]) ?? [],
        providerMetadata: item,
      } as MessageTemplate);
      refreshed.push(row);
    }
    return refreshed;
  }

  async remove(client: Client, id: string): Promise<void> {
    const t = await this.get(client.id, id);
    await this.ycloud.deleteTemplate(t.wabaId, t.name);
    await t.destroy();
  }
}
