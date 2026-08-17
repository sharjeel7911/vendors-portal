import { Controller, Get, Query } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';

@Controller('api/vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Get()
  findAll(@Query('status') status?: string) {
    return this.vehiclesService.findAll(status);
  }
}
