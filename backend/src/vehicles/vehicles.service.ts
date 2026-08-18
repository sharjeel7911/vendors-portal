import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    vendor_id: number;
    type: string;
    capacity: number;
    depot: string;
    plate_no: string;
    status?: string;
  }) {
    return this.prisma.vehicles.create({ data });
  }

  async fetchAllVehicles() {
    return this.prisma.vehicles.findMany({ orderBy: { created_at: 'desc' } });
  }

  async fetchOneVehicle(id: number) {
    const vehicle = await this.prisma.vehicles.findUnique({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id ${id} not found`);
    }
    return vehicle;
  }

  async update(id: number, data: Partial<{
    type: string;
    capacity: number;
    depot: string;
    plate_no: string;
    status: string;
  }>) {
    await this.fetchOneVehicle(id); // throws 404 if not found
    return this.prisma.vehicles.update({ where: { id }, data });
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.fetchOneVehicle(id); // throws 404 if not found
    await this.prisma.vehicles.delete({ where: { id } });
    return { message: 'Vehicle deleted successfully' };
  }
}
