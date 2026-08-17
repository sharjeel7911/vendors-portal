import { Controller, Get, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('api/stops')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAllStops(@Query('status') status?: string) {
    return this.ordersService.findAllStops(status);
  }
}
