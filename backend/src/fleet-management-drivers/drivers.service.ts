import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Driver } from './drivers.entity';
import { Vehicle } from '../fleet-management-vehicles/vehicles.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}
  async create(driverData: Partial<Driver>): Promise<Driver> {
    if (driverData.vehicle_id !== undefined && driverData.vehicle_id !== null) {
      await this.markVehicleUnavailable(driverData.vehicle_id);
    }

    const driver = this.driverRepository.create(driverData);
    return this.driverRepository.save(driver);
  }
  async fetchAllDrivers(): Promise<Driver[]> {
    return this.driverRepository.find();
  }
  async fetchOneDriver(id: number): Promise<Driver> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException('Driver with given id not found!');
    }
    return driver;
  }
  async update(id: number, updatedDriver: Partial<Driver>): Promise<Driver> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException('Driver with given id not found!');
    }

    if (
      updatedDriver.vehicle_id !== undefined &&
      updatedDriver.vehicle_id !== null
    ) {
      const alreadyHadThisVehicle =
        driver.vehicle_id === updatedDriver.vehicle_id;
      await this.markVehicleUnavailable(
        updatedDriver.vehicle_id,
        alreadyHadThisVehicle,
      );
    }

    if (
      updatedDriver.vehicle_id === null &&
      driver.vehicle_id !== null &&
      driver.vehicle_id !== undefined
    ) {
      await this.markVehicleAvailable(driver.vehicle_id);
    }

    const updated = Object.assign(driver, updatedDriver);
    return this.driverRepository.save(updated);
  }
  async remove(id: number): Promise<{ message: string }> {
    const driver = await this.driverRepository.findOneBy({ id });
    if (!driver) {
      throw new NotFoundException('Driver with given id not found!');
    }

    if (driver.vehicle_id !== null && driver.vehicle_id !== undefined) {
      await this.markVehicleAvailable(driver.vehicle_id);
    }

    await this.driverRepository.remove(driver);
    return { message: 'Driver deleted successfully' };
  }

  private async markVehicleUnavailable(
    vehicleId: number,
    allowIfAlreadyTaken = false,
  ): Promise<void> {
    const vehicle = await this.vehicleRepository.findOneBy({ id: vehicleId });
    if (!vehicle) {
      throw new NotFoundException('Vehicle with given id not found!');
    }
    if (vehicle.isAvailable === false && !allowIfAlreadyTaken) {
      throw new BadRequestException(
        'This vehicle is already assigned to another driver and is not available.',
      );
    }
    vehicle.isAvailable = false;
    await this.vehicleRepository.save(vehicle);
  }

  private async markVehicleAvailable(vehicleId: number): Promise<void> {
    const vehicle = await this.vehicleRepository.findOneBy({ id: vehicleId });
    if (!vehicle) {
      return;
    }
    vehicle.isAvailable = true;
    await this.vehicleRepository.save(vehicle);
  }
}
