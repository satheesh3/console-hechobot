import { Injectable, Logger } from '@nestjs/common';
import { ChannelsService } from '../channels/channels.service';
import { ClientsService } from '../clients/clients.service';
import { YcloudService } from '../ycloud/ycloud.service';
import { EmbeddedSignupCallbackDto } from './embedded-signup.dto';

@Injectable()
export class EmbeddedSignupService {
  private readonly logger = new Logger(EmbeddedSignupService.name);

  constructor(
    private readonly clients: ClientsService,
    private readonly channels: ChannelsService,
    private readonly ycloud: YcloudService,
  ) {}

  async onSignup(dto: EmbeddedSignupCallbackDto) {
    // Validate the client exists. Throws 404 if not.
    const client = await this.clients.get(dto.clientId);

    // TODO: when we have YCloud partner credentials, call the real channel
    // registration / subscription endpoint here so YCloud routes inbound
    // webhooks for this number to us. For now this is a no-op stub.
    const providerResult = await this.ycloud.registerChannel({
      wabaId: dto.wabaId,
      phoneNumberId: dto.phoneNumberId,
      displayPhoneNumber: dto.displayPhoneNumber,
    });

    const channel = await this.channels.upsertForClient(client.id, {
      wabaId: dto.wabaId,
      phoneNumberId: dto.phoneNumberId,
      displayPhoneNumber: dto.displayPhoneNumber,
      verifiedName: dto.verifiedName,
      ycloudMetadata: { ...dto.ycloudMetadata, providerResult },
    });

    // New channels start pending; flip to active once YCloud confirms.
    // TODO: replace with a real readiness check; for now we trust the caller.
    if (channel.status === 'pending') {
      await channel.update({ status: 'active' });
    }

    this.logger.log(
      `Onboarded waba=${dto.wabaId} phone=${dto.displayPhoneNumber} for client=${client.id}`,
    );
    return channel;
  }
}
