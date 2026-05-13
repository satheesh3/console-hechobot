import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Client } from './client.model';
import { CreateClientDto, UpdateClientDto } from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(@InjectModel(Client) private readonly clients: typeof Client) {}

  create(dto: CreateClientDto): Promise<Client> {
    return this.clients.create({
      name: dto.name,
      contactEmail: dto.contactEmail,
      metadata: dto.metadata ?? null,
    } as Client);
  }

  list(): Promise<Client[]> {
    return this.clients.findAll({ order: [['createdAt', 'DESC']] });
  }

  async get(id: string): Promise<Client> {
    const c = await this.clients.findByPk(id);
    if (!c) throw new NotFoundException('Client not found');
    return c;
  }

  async update(id: string, dto: UpdateClientDto): Promise<Client> {
    const c = await this.get(id);
    await c.update(dto);
    return c;
  }

  async remove(id: string): Promise<void> {
    const c = await this.get(id);
    await c.destroy();
  }
}
