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
import { DriversService } from './drivers.service';

@Controller('api/drivers')
export class DriversController {
  constructor(private readonly driverService: DriversService) {}

  @Post()
  create(
    @Body()
    body: {
      vendor_id: number;
      name: string;
      phone: string;
      liscence_no: string;
      working_hours: string;
      status: string;
      latitude: number;
      longitude: number;
      vehicle_id?: number | null;
    },
  ) {
    return this.driverService.create(body);
  }

  @Get()
  fetchAll() {
    return this.driverService.fetchAllDrivers();
  }

  @Get(':id')
  fetchOne(@Param('id', ParseIntPipe) id: number) {
    return this.driverService.fetchOneDriver(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: Partial<{
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
    return this.driverService.update(id, body);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.driverService.remove(id);
  }
}
