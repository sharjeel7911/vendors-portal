import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as XLSX from 'xlsx';
@Injectable()
export class OrdersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getallorders() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('orders')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  

  async getordersbyid(id: number) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async createorder(data: {
    vendor_id: number, customer_name: string,address: string, coordinates: string,time_window: string, priority: string,weight: number,notes: string, status: string
  }) {
    try {
      const newOrder = {
        id: Date.now(),
        ...data,
      };

      const { data: order, error } = await this.supabaseService
        .getClient()
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return order;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async updateorder(
    id: number,
    data: {vendor_id: number,customer_name: string,address: string,coordinates: string, time_window: string,priority: string,weight: number,notes: string,status: string
    },
  ) {
    try {
      const { data: order, error } = await this.supabaseService
        .getClient()
        .from('orders')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return order;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

  async updateOrderStatus(id: number, status: string) {
    try {
      const { data: order, error } = await this.supabaseService
        .getClient()
        .from('orders')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return order;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  }

async deleteOrder(id: number) {
  try {
    const { error } = await this.supabaseService
      .getClient()
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

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
        errors.push({
          row,
          error: 'vendor_id is required',
        });
        return;
      }

      if (!order.customer_name) {
        errors.push({
          row,
          error: 'customer_name is required',
        });
        return;
      }

      if (!order.address) {
        errors.push({
          row,
          error: 'address is required',
        });
        return;
      }

      if (!order.coordinates) {
        errors.push({
          row,
          error: 'coordinates are required',
        });
        return;
      }

      if (!order.time_window) {
        errors.push({
          row,
          error: 'time_window is required',
        });
        return;
      }

      if (!order.priority) {
        errors.push({
          row,
          error: 'priority is required',
        });
        return;
      }

      if (order.weight === undefined || order.weight === null) {
        errors.push({
          row,
          error: 'weight is required',
        });
        return;
      }

      const duplicateKey =
        `${order.vendor_id}-${order.customer_name}-${order.address}`
          .toLowerCase();

      if (seenOrders.has(duplicateKey)) {
        errors.push({
          row,
          error: 'Duplicate order found',
        });
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

    const { data, error } = await this.supabaseService
      .getClient()
      .from('orders')
      .insert(validOrders)
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return {
      message: 'Orders imported successfully',
      imported: data?.length || 0,
      errors,
      data,
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
        errors.push({
          row,
          error: 'vendor_id is required',
        });
      }

      if (!order.customer_name) {
        errors.push({
          row,
          error: 'customer_name is required',
        });
      }

      if (!order.address) {
        errors.push({
          row,
          error: 'address is required',
        });
      }

      if (!order.coordinates) {
        errors.push({
          row,
          error: 'coordinates are required',
        });
      }

      if (!order.time_window) {
        errors.push({
          row,
          error: 'time_window is required',
        });
      }

      if (!order.priority) {
        errors.push({
          row,
          error: 'priority is required',
        });
      }

      if (order.weight === undefined || order.weight === null) {
        errors.push({
          row,
          error: 'weight is required',
        });
      }

      const duplicateKey =
        `${order.vendor_id}-${order.customer_name}-${order.address}`
          .toLowerCase();

      if (seenOrders.has(duplicateKey)) {
        errors.push({
          row,
          error: 'Duplicate order found',
        });
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