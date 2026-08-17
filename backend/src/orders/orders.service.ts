import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAllStops(status?: string) {
    const where = status ? { status } : {};
    const orders = await this.prisma.orders.findMany({ where });
    
    return {
      stops: orders.map(o => {
        let lat = null;
        let lng = null;
        if (o.coordinates) {
          const parts = o.coordinates.split(',');
          if (parts.length === 2) {
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
          }
        }
        
        // Parse time window
        let timeWindow = null;
        if (o.time_window) {
          const twParts = o.time_window.split('-');
          if (twParts.length === 2) {
            timeWindow = { start: twParts[0].trim(), end: twParts[1].trim() };
          }
        }

        return {
          id: `stop_${o.id}`,
          orderId: `ORD-${o.id}`,
          address: o.address,
          latitude: lat,
          longitude: lng,
          status: o.status.toUpperCase(),
          timeWindow
        };
      })
    };
  }
}
