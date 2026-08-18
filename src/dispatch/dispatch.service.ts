import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DispatchService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async getDispatchedRoutes() {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('routes')
      .select('*')
      .eq('status', 'dispatched');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  async getRoute(routeId: number) {
    const { data, error } = await this.supabaseService
      .getClient()
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException('Route not found');
    }

    return data;
  }

  async assignRoute(routeId: number, driverId: number) {
    if (!Number.isInteger(routeId) || !Number.isInteger(driverId)) {
      throw new BadRequestException('Invalid route ID or driver ID');
    }

    const client = this.supabaseService.getClient();

    const { data: driver, error: driverError } = await client
      .from('drivers')
      .select('id')
      .eq('id', driverId)
      .maybeSingle();

    if (driverError) {
      throw new Error(driverError.message);
    }

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    const { data: route, error: routeError } = await client
      .from('routes')
      .select('id')
      .eq('id', routeId)
      .maybeSingle();

    if (routeError) {
      throw new Error(routeError.message);
    }

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const { data, error } = await client
      .from('routes')
      .update({
        driver_id: driverId,
        status: 'dispatched',
      })
      .eq('id', routeId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException('Route could not be updated');
    }

    return data;
  }

  async cancelRoute(routeId: number) {
    const client = this.supabaseService.getClient();

    const { data: route, error: routeError } = await client
      .from('routes')
      .select('id')
      .eq('id', routeId)
      .maybeSingle();

    if (routeError) {
      throw new Error(routeError.message);
    }

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const { data, error } = await client
      .from('routes')
      .update({
        status: 'cancelled',
      })
      .eq('id', routeId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException('Route could not be cancelled');
    }

    return data;
  }

  async dispatchRoute(routeId: number) {
    const client = this.supabaseService.getClient();

    const { data: route, error: routeError } = await client
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .maybeSingle();

    if (routeError) {
      throw new Error(routeError.message);
    }

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    if (!route.driver_id) {
      throw new BadRequestException('Route must have a driver before dispatching');
    }

    const { data, error } = await client
      .from('routes')
      .update({
        status: 'dispatched',
      })
      .eq('id', routeId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException('Route could not be dispatched');
    }

    return data;
  }

  async reoptimizeRoute(routeId: number) {
    const client = this.supabaseService.getClient();

    const { data: route, error: routeError } = await client
      .from('routes')
      .select('*')
      .eq('id', routeId)
      .maybeSingle();

    if (routeError) {
      throw new Error(routeError.message);
    }

    if (!route) {
      throw new NotFoundException('Route not found');
    }

    const { data: deliveries, error: deliveriesError } = await client
      .from('deliveries')
      .select('*')
      .eq('route_id', routeId)
      .order('sequence', { ascending: true });

    if (deliveriesError) {
      throw new Error(deliveriesError.message);
    }

    const updatedDeliveries = deliveries.map((delivery, index) => ({
      id: delivery.id,
      sequence: index + 1,
    }));

    for (const delivery of updatedDeliveries) {
      const { error } = await client
        .from('deliveries')
        .update({
          sequence: delivery.sequence,
        })
        .eq('id', delivery.id);

      if (error) {
        throw new Error(error.message);
      }
    }

    const { data, error } = await client
      .from('routes')
      .update({
        status: 'dispatched',
      })
      .eq('id', routeId)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new NotFoundException('Route could not be reoptimized');
    }

    return {
      message: 'Route reoptimized successfully',
      route: data,
      deliveries: updatedDeliveries,
    };
  }
}