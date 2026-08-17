import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RoutesService {
  constructor(private prisma: PrismaService) {}

  async getSummary() {
    const routes = await this.prisma.routes.findMany({
      include: {
        deliveries: true,
      }
    });

    const activeDrivers = await this.prisma.drivers.count({
      where: { status: 'IN_USE' }
    });

    const activeVehicles = await this.prisma.vehicles.count({
      where: { status: 'IN_USE' }
    });

    let totalStops = 0;
    let totalDistanceKm = 0;
    let estimatedDurationMinutes = 0;

    routes.forEach(r => {
      totalStops += r.deliveries.length;
      totalDistanceKm += r.total_distance || 0;
      estimatedDurationMinutes += r.total_duration || 0;
    });

    return {
      totalRoutes: routes.length,
      totalStops,
      totalDistanceKm,
      estimatedDurationMinutes,
      activeDrivers,
      activeVehicles
    };
  }

  async findAll(filters: any) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    
    // Simplistic driver filtering (assuming filter by ID)
    if (filters.driver) {
      where.driver_id = parseInt(filters.driver.replace('driver_', ''), 10);
    }
    
    if (filters.vehicle) {
      where.vehicle_id = parseInt(filters.vehicle.replace('vehicle_', ''), 10);
    }

    const routes = await this.prisma.routes.findMany({
      where,
      include: {
        drivers: true,
        vehicles: true,
        deliveries: true
      }
    });

    return {
      routes: routes.map(r => ({
        id: r.id.toString().padStart(3, '0'),
        driver: r.drivers ? {
          id: `driver_${r.drivers.id}`,
          name: r.drivers.name
        } : null,
        vehicle: r.vehicles ? {
          id: `vehicle_${r.vehicles.id}`,
          name: r.vehicles.plate_no
        } : null,
        stops: r.deliveries.length,
        distanceKm: r.total_distance || 0,
        durationMinutes: r.total_duration || 0,
        status: r.status.toUpperCase(),
        completedStops: r.deliveries.filter(d => d.status === 'delivered').length,
        totalStops: r.deliveries.length
      }))
    };
  }

  async findOne(routeIdStr: string) {
    const id = parseInt(routeIdStr, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid route ID');

    const route = await this.prisma.routes.findUnique({
      where: { id },
      include: {
        drivers: true,
        vehicles: true,
        deliveries: {
          include: {
            orders: true
          }
        }
      }
    });

    if (!route) throw new NotFoundException('Route not found');

    return {
      id: route.id.toString().padStart(3, '0'),
      status: route.status.toUpperCase(),
      driver: route.drivers ? {
        id: `driver_${route.drivers.id}`,
        name: route.drivers.name
      } : null,
      vehicle: route.vehicles ? {
        id: `vehicle_${route.vehicles.id}`,
        name: route.vehicles.plate_no,
        capacity: route.vehicles.capacity
      } : null,
      stops: route.deliveries.map(d => {
        let lat = null, lng = null;
        if (d.orders?.coordinates) {
          const parts = d.orders.coordinates.split(',');
          if (parts.length === 2) {
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
          }
        }
        return {
          sequence: d.sequence,
          orderId: `ORD-${d.order_id}`,
          address: d.orders?.address,
          latitude: lat,
          longitude: lng,
          status: d.status.toUpperCase()
        };
      }).sort((a, b) => (a.sequence || 0) - (b.sequence || 0)),
      distanceKm: route.total_distance || 0,
      durationMinutes: route.total_duration || 0,
      completedStops: route.deliveries.filter(d => d.status === 'delivered').length,
      totalStops: route.deliveries.length,
      geometry: route.geometry || null
    };
  }

  async getMap(routeIdStr: string) {
    const route = await this.findOne(routeIdStr);
    
    let geometry = null;
    if (route.geometry) {
      try {
        geometry = JSON.parse(route.geometry);
      } catch (e) {
        // Fallback for simple string if needed
      }
    }

    return {
      routeId: route.id,
      geometry,
      stops: route.stops,
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes
    };
  }

  async assignDriver(routeIdStr: string, driverIdStr: string) {
    const routeId = parseInt(routeIdStr, 10);
    const driverId = parseInt(driverIdStr.replace('driver_', ''), 10);
    
    if (isNaN(routeId) || isNaN(driverId)) throw new BadRequestException('Invalid ID');

    const driver = await this.prisma.drivers.findUnique({ where: { id: driverId } });
    if (!driver) throw new NotFoundException('Driver not found');
    if (driver.status !== 'AVAILABLE') throw new BadRequestException('Driver is not available');

    // Update driver status and route
    await this.prisma.drivers.update({
      where: { id: driverId },
      data: { status: 'IN_USE' }
    });

    const route = await this.prisma.routes.update({
      where: { id: routeId },
      data: { driver_id: driverId }
    });

    return {
      success: true,
      route: {
        id: route.id.toString().padStart(3, '0'),
        driverId: `driver_${route.driver_id}`
      }
    };
  }

  async assignVehicle(routeIdStr: string, vehicleIdStr: string) {
    const routeId = parseInt(routeIdStr, 10);
    const vehicleId = parseInt(vehicleIdStr.replace('vehicle_', ''), 10);
    
    if (isNaN(routeId) || isNaN(vehicleId)) throw new BadRequestException('Invalid ID');

    const vehicle = await this.prisma.vehicles.findUnique({ where: { id: vehicleId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.status !== 'AVAILABLE') throw new BadRequestException('Vehicle is not available');

    // Update vehicle status and route
    await this.prisma.vehicles.update({
      where: { id: vehicleId },
      data: { status: 'IN_USE' }
    });

    const route = await this.prisma.routes.update({
      where: { id: routeId },
      data: { vehicle_id: vehicleId }
    });

    return {
      success: true,
      route: {
        id: route.id.toString().padStart(3, '0'),
        vehicleId: `vehicle_${route.vehicle_id}`
      }
    };
  }

  async updateStatus(routeIdStr: string, status: string) {
    const id = parseInt(routeIdStr, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');

    const validStatuses = ['PLANNED', 'READY', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException('Invalid status');
    }

    const route = await this.prisma.routes.update({
      where: { id },
      data: { status: status.toLowerCase() }
    });

    return { success: true, route };
  }

  async dispatch(routeIdStr: string) {
    const id = parseInt(routeIdStr, 10);
    if (isNaN(id)) throw new BadRequestException('Invalid ID');

    const route = await this.prisma.routes.findUnique({
      where: { id },
      include: { deliveries: true }
    });

    if (!route) throw new NotFoundException('Route not found');
    if (!route.driver_id) throw new BadRequestException('Route has no driver');
    if (!route.vehicle_id) throw new BadRequestException('Route has no vehicle');
    if (route.deliveries.length === 0) throw new BadRequestException('Route has no stops');
    
    if (!['planned', 'ready'].includes(route.status)) {
      throw new BadRequestException('Route is not in a dispatchable status');
    }

    const updatedRoute = await this.prisma.routes.update({
      where: { id },
      data: { status: 'dispatched' }
    });

    return { success: true, route: updatedRoute };
  }

  async createRoute(data: any) {
    // A simplified create route logic
    const { date, driverId, vehicleId, stopIds } = data;
    
    const dId = driverId ? parseInt(driverId.replace('driver_', ''), 10) : null;
    const vId = vehicleId ? parseInt(vehicleId.replace('vehicle_', ''), 10) : null;

    const route = await this.prisma.routes.create({
      data: {
        date: new Date(date),
        driver_id: dId,
        vehicle_id: vId,
        status: 'planned',
        total_distance: 10, // Mocked
        total_duration: 60, // Mocked
      }
    });

    if (stopIds && stopIds.length > 0) {
      const deliveriesData = (stopIds as string[]).map((stopIdStr: string, index: number) => {
        const orderId = parseInt(stopIdStr.replace('stop_', ''), 10);
        return {
          route_id: route.id,
          order_id: orderId,
          sequence: index + 1,
          status: 'pending'
        };
      });

      await this.prisma.deliveries.createMany({
        data: deliveriesData
      });
    }

    return this.findOne(route.id.toString());
  }

  optimizePlaceholder(data: any) {
    return {
      success: true,
      status: "COMPLETED",
      routesCreated: 6,
      distanceReductionPercent: 14,
      estimatedTimeReductionPercent: 22,
      routes: []
    };
  }
}
