import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vehicle } from './vehicles.entity';
import { Repository } from 'typeorm';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private vehicleRepository: Repository<Vehicle>,
  ) {}
  async create(vehicleData: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = this.vehicleRepository.create(vehicleData);
    return this.vehicleRepository.save(vehicle);
  }
  async fetchAllVehicles(): Promise<Vehicle[]> {
    return this.vehicleRepository.find();
  }
  async fetchOneVehicle(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException('Vehicle with given id not found!');
    }
    return vehicle;
  }
  async update(id: number, updatedVehicle: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException('Vehicle with given id not found!');
    }
    const updated = Object.assign(vehicle, updatedVehicle);
    return this.vehicleRepository.save(updated);
  }
  async remove(id: number): Promise<{ message: string }> {
    const vehicle = await this.vehicleRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException('Vehicle with given id not found!');
    }
    await this.vehicleRepository.remove(vehicle);
    return { message: 'Vehicle deleted successfully' };
  }
}
