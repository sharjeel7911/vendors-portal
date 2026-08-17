import { Controller, Get, Query } from '@nestjs/common';
import { DriversService } from './drivers.service';

@Controller('api/drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.driversService.findAll(status);
  }

  @Get('locations')
  getLocations() {
    return this.driversService.getLocations();
  }
}
