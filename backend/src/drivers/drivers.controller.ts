import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
// import { Driver } from 'typeorm';
import { Driver } from './drivers.entity';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driverService: DriversService) {}

  @Post()
  async createDriver(@Body() body: Partial<Driver>): Promise<Driver> {
    return this.driverService.create(body);
  }
  @Get()
  async fetchAllDrivers(): Promise<Driver[]> {
    return this.driverService.fetchAllDrivers();
  }
  @Get(':id')
  async fetchOneDrivers(@Param('id') id: number): Promise<Driver> {
    return this.driverService.fetchOneDriver(id);
  }
  @Put(':id')
  async updateDriver(
    @Param('id') id: number,
    @Body() body: Partial<Driver>,
  ): Promise<Driver> {
    return this.driverService.update(id, body);
  }
  @Delete(':id')
  async deleteDriver(@Param('id') id: number): Promise<{ message: string }> {
    return this.driverService.remove(id);
  }
}
