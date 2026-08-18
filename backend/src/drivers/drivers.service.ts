import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    vendor_id: number;
    name: string;
    phone: string;
    liscence_no: string;
    working_hours: string;
    status: string;
    latitude: number;
    longitude: number;
    vehicle_id?: number | null;
  }) {
    if (data.vehicle_id != null) {
      await this.markVehicleInUse(data.vehicle_id);
    }
    return this.prisma.drivers.create({ data });
  }

  async fetchAllDrivers() {
    return this.prisma.drivers.findMany({ orderBy: { created_at: 'desc' } });
  }

  async fetchOneDriver(id: number) {
    const driver = await this.prisma.drivers.findUnique({ where: { id } });
    if (!driver) {
      throw new NotFoundException(`Driver with id ${id} not found`);
    }
    return driver;
  }

  async update(
    id: number,
    data: Partial<{
      name: string;
      phone: string;
      liscence_no: string;
      working_hours: string;
      status: string;
      latitude: number;
      longitude: number;
      vehicle_id: number | null;
    }>,
  ) {
    const driver = await this.fetchOneDriver(id);

    // Assigning a new vehicle
    if (data.vehicle_id != null && data.vehicle_id !== driver.vehicle_id) {
      await this.markVehicleInUse(data.vehicle_id);
    }

    // Releasing a vehicle
    if (data.vehicle_id === null && driver.vehicle_id != null) {
      await this.markVehicleAvailable(driver.vehicle_id);
    }

    return this.prisma.drivers.update({ where: { id }, data });
  }

  async remove(id: number): Promise<{ message: string }> {
    const driver = await this.fetchOneDriver(id);

    if (driver.vehicle_id != null) {
      await this.markVehicleAvailable(driver.vehicle_id);
    }

    await this.prisma.drivers.delete({ where: { id } });
    return { message: 'Driver deleted successfully' };
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private async markVehicleInUse(vehicleId: number): Promise<void> {
    const vehicle = await this.prisma.vehicles.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with id ${vehicleId} not found`);
    }
    if (vehicle.status !== 'AVAILABLE') {
      throw new BadRequestException(
        'This vehicle is already assigned to another driver and is not available.',
      );
    }
    await this.prisma.vehicles.update({
      where: { id: vehicleId },
      data: { status: 'IN_USE' },
    });
  }

  private async markVehicleAvailable(vehicleId: number): Promise<void> {
    await this.prisma.vehicles.update({
      where: { id: vehicleId },
      data: { status: 'AVAILABLE' },
    });
  }
}
