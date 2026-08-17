import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly supabaseService: SupabaseService,
  ) {}

  async getDailyDeliverySummary(date: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('deliveries')
      .select(`
        id,
        order_id,
        route_id,
        eta,
        delivered_at,
        status,
        created_at
      `)
      .gte('created_at', `${date}T00:00:00`)
      .lte('created_at', `${date}T23:59:59`);

    if (error) {
      throw new Error(error.message);
    }

    const total = data?.length || 0;

    const completed =
      data?.filter(
        (delivery) => delivery.status === 'completed',
      ).length || 0;

    const pending =
      data?.filter(
        (delivery) => delivery.status === 'pending',
      ).length || 0;

    const failed =
      data?.filter(
        (delivery) => delivery.status === 'failed',
      ).length || 0;

    const delayed =
      data?.filter(
        (delivery) => delivery.status === 'delayed',
      ).length || 0;

    return {
      date,
      totalDeliveries: total,
      completed,
      pending,
      failed,
      delayed,
    };
  }


  async getWeeklyDeliverySummary(
    startDate: string,
    endDate: string,
  ) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('deliveries')
      .select(`
        id,
        order_id,
        route_id,
        eta,
        delivered_at,
        status,
        created_at
      `)
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (error) {
      throw new Error(error.message);
    }

    const total = data?.length || 0;

    const completed =
      data?.filter(
        (delivery) => delivery.status === 'completed',
      ).length || 0;

    const failed =
      data?.filter(
        (delivery) => delivery.status === 'failed',
      ).length || 0;

    const delayed =
      data?.filter(
        (delivery) => delivery.status === 'delayed',
      ).length || 0;

    return {
      startDate,
      endDate,
      totalDeliveries: total,
      completed,
      failed,
      delayed,
    };
  }


  async getDriverPerformance() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('routes')
      .select(`
        id,
        driver_id,
        date,
        total_distance,
        total_duration,
        status
      `);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getOnTimeRate() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('deliveries')
      .select(`
        id,
        eta,
        delivered_at,
        status
      `);

    if (error) {
      throw new Error(error.message);
    }

    const completedDeliveries =
      data?.filter(
        (delivery) =>
          delivery.status === 'completed' &&
          delivery.delivered_at,
      ) || [];

    const onTimeDeliveries = completedDeliveries.filter(
      (delivery) =>
        new Date(delivery.delivered_at).getTime() <=
        new Date(delivery.eta).getTime(),
    );

    const total = completedDeliveries.length;

    const onTime = onTimeDeliveries.length;

    const rate =
      total > 0
        ? Number(((onTime / total) * 100).toFixed(2))
        : 0;

    return {
      totalCompletedDeliveries: total,
      onTimeDeliveries: onTime,
      onTimeRate: rate,
    };
  }

  async getRouteEfficiency() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('routes')
      .select(`
        id,
        vendor_id,
        driver_id,
        vehicle_id,
        date,
        total_distance,
        total_duration,
        status
      `);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }
}