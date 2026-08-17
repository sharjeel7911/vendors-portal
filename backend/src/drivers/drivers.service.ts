import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    const where = status ? { status } : {};
    const drivers = await this.prisma.drivers.findMany({ where });
    
    return {
      drivers: drivers.map(d => ({
        id: `driver_${d.id}`,
        name: d.name,
        phone: d.phone,
        status: d.status,
        currentRouteId: null, // Basic implementation, can be derived if needed
        latitude: d.latitude,
        longitude: d.longitude
      }))
    };
  }

  async getLocations() {
    const drivers = await this.prisma.drivers.findMany({
      where: { status: 'AVAILABLE' }
    });
    
    return {
      drivers: drivers.map(d => ({
        driverId: `driver_${d.id}`,
        name: d.name,
        latitude: d.latitude,
        longitude: d.longitude,
        status: d.status
      }))
    };
  }
}
