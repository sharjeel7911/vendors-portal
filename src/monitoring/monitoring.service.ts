import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MonitoringService {
  constructor(private readonly supabaseService: SupabaseService) {}


  async getDriverLocations() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('drivers')
        .select('id, vendor_id, name,latitude,longitude ,status');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async getDeliveryProgress() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('deliveries')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }


  async getDeliveryStatus(status: string) {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('deliveries')
        .select('*')
        .eq('status', status);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async getDelayedDeliveries() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('deliveries')
        .select('*')
        .eq('status', 'delayed');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async getFailedDeliveries() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('deliveries')
        .select('*')
        .eq('status', 'failed');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  async getAlerts() {
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('notifications')
        .select('*')
        .in('type', ['delay', 'failed']);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
