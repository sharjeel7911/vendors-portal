import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as XLSX from 'xlsx';

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

  async getallorders() {
    try {
      const orders = await this.prisma.orders.findMany();
      return orders;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async getordersbyid(id: number) {
    try {
      const order = await this.prisma.orders.findUnique({ where: { id } });
      if (!order) throw new Error('Order not found');
      return order;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async createorder(data: {
    vendor_id: number, customer_name: string, address: string, coordinates: string, time_window: string, priority: string, weight: number, notes: string, status: string
  }) {
    try {
      const order = await this.prisma.orders.create({
        data: {
          vendor_id: data.vendor_id,
          customer_name: data.customer_name,
          address: data.address,
          coordinates: data.coordinates,
          time_window: data.time_window,
          priority: data.priority,
          weight: data.weight,
          notes: data.notes,
          status: data.status,
        }
      });
      return order;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async updateorder(
    id: number,
    data: {vendor_id: number,customer_name: string,address: string,coordinates: string, time_window: string,priority: string,weight: number,notes: string,status: string}
  ) {
    try {
      const order = await this.prisma.orders.update({
        where: { id },
        data
      });
      return order;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async updateOrderStatus(id: number, status: string) {
    try {
      const order = await this.prisma.orders.update({
        where: { id },
        data: { status }
      });
      return order;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async deleteOrder(id: number) {
    try {
      await this.prisma.orders.delete({
        where: { id }
      });
      return {
        message: 'Order deleted successfully',
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async importOrders(file: Express.Multer.File) {
    try {
      if (!file) {
        throw new Error('CSV file is required');
      }

      const workbook = XLSX.read(file.buffer, {
        type: 'buffer',
      });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const orders = XLSX.utils.sheet_to_json(sheet);

      if (orders.length === 0) {
        throw new Error('CSV file is empty');
      }

      const validOrders: any[] = [];
      const errors: any[] = [];
      const seenOrders = new Set();

      orders.forEach((order: any, index: number) => {
        const row = index + 2;

        if (!order.vendor_id) {
          errors.push({ row, error: 'vendor_id is required' });
          return;
        }

        if (!order.customer_name) {
          errors.push({ row, error: 'customer_name is required' });
          return;
        }

        if (!order.address) {
          errors.push({ row, error: 'address is required' });
          return;
        }

        if (!order.coordinates) {
          errors.push({ row, error: 'coordinates are required' });
          return;
        }

        if (!order.time_window) {
          errors.push({ row, error: 'time_window is required' });
          return;
        }

        if (!order.priority) {
          errors.push({ row, error: 'priority is required' });
          return;
        }

        if (order.weight === undefined || order.weight === null) {
          errors.push({ row, error: 'weight is required' });
          return;
        }

        const duplicateKey =
          `${order.vendor_id}-${order.customer_name}-${order.address}`
            .toLowerCase();

        if (seenOrders.has(duplicateKey)) {
          errors.push({ row, error: 'Duplicate order found' });
          return;
        }

        seenOrders.add(duplicateKey);

        validOrders.push({
          vendor_id: Number(order.vendor_id),
          customer_name: String(order.customer_name),
          address: String(order.address),
          coordinates: String(order.coordinates),
          time_window: String(order.time_window),
          priority: String(order.priority),
          weight: Number(order.weight),
          notes: order.notes ? String(order.notes) : null,
          status: order.status ? String(order.status) : 'pending',
        });
      });

      if (validOrders.length === 0) {
        return {
          message: 'No valid orders found',
          imported: 0,
          errors,
        };
      }

      const created = await this.prisma.orders.createMany({
        data: validOrders,
        skipDuplicates: true
      });

      return {
        message: 'Orders imported successfully',
        imported: created.count || 0,
        errors,
        data: validOrders,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async validateOrders(file: Express.Multer.File) {
    try {
      if (!file) {
        throw new Error('CSV file is required');
      }

      const workbook = XLSX.read(file.buffer, {
        type: 'buffer',
      });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const orders = XLSX.utils.sheet_to_json(sheet);

      if (orders.length === 0) {
        throw new Error('CSV file is empty');
      }

      const errors: any[] = [];
      const seenOrders = new Set();

      orders.forEach((order: any, index: number) => {
        const row = index + 2;

        if (!order.vendor_id) {
          errors.push({ row, error: 'vendor_id is required' });
        }

        if (!order.customer_name) {
          errors.push({ row, error: 'customer_name is required' });
        }

        if (!order.address) {
          errors.push({ row, error: 'address is required' });
        }

        if (!order.coordinates) {
          errors.push({ row, error: 'coordinates are required' });
        }

        if (!order.time_window) {
          errors.push({ row, error: 'time_window is required' });
        }

        if (!order.priority) {
          errors.push({ row, error: 'priority is required' });
        }

        if (order.weight === undefined || order.weight === null) {
          errors.push({ row, error: 'weight is required' });
        }

        const duplicateKey =
          `${order.vendor_id}-${order.customer_name}-${order.address}`
            .toLowerCase();

        if (seenOrders.has(duplicateKey)) {
          errors.push({ row, error: 'Duplicate order found' });
        }

        seenOrders.add(duplicateKey);
      });

      return {
        totalOrders: orders.length,
        valid: errors.length === 0,
        errors,
      };
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
