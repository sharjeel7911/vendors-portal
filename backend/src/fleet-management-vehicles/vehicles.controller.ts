import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicles.entity';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicleService: VehiclesService) {}

  @Post()
  async createVehicle(@Body() body: Partial<Vehicle>): Promise<Vehicle> {
    return this.vehicleService.create(body);
  }
  @Get()
  async fetchAllVehicles(): Promise<Vehicle[]> {
    return this.vehicleService.fetchAllVehicles();
  }
  @Get(':id')
  async fetchOneVehicles(@Param('id') id: number): Promise<Vehicle> {
    return this.vehicleService.fetchOneVehicle(id);
  }
  @Put(':id')
  async updateVehicle(
    @Param('id') id: number,
    @Body() body: Partial<Vehicle>,
  ): Promise<Vehicle> {
    return this.vehicleService.update(id, body);
  }
  @Delete(':id')
  async deleteVehicle(@Param('id') id: number): Promise<{ message: string }> {
    return this.vehicleService.remove(id);
  }
}
