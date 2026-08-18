import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';

@Controller('api/vehicles')
export class VehiclesController {
  constructor(private readonly vehicleService: VehiclesService) {}

  @Post()
  create(
    @Body()
    body: {
      vendor_id: number;
      type: string;
      capacity: number;
      depot: string;
      plate_no: string;
      status?: string;
    },
  ) {
    return this.vehicleService.create(body);
  }

  @Get()
  fetchAll() {
    return this.vehicleService.fetchAllVehicles();
  }

  @Get(':id')
  fetchOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.fetchOneVehicle(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: Partial<{
      type: string;
      capacity: number;
      depot: string;
      plate_no: string;
      status: string;
    }>,
  ) {
    return this.vehicleService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehicleService.remove(id);
  }
}
