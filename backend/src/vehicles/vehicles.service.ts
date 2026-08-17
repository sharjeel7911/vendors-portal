import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    const where = status ? { status } : {};
    const vehicles = await this.prisma.vehicles.findMany({ where });
    
    return {
      vehicles: vehicles.map(v => ({
        id: `vehicle_${v.id}`,
        vehicleNumber: v.plate_no,
        type: v.type,
        capacity: v.capacity,
        status: v.status,
        driverId: null // Basic implementation, would check routes or assignments
      }))
    };
  }
}
