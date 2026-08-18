import { Controller, Get, Query, Body, Delete, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/stops')
export class StopsController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAllStops(@Query('status') status?: string) {
    return this.ordersService.findAllStops(status);
  }
}

@Controller('api/orders')
export class OrdersController {
  constructor(private readonly orderService: OrdersService) {}

  @Get()
  getallorders() {
    return this.orderService.getallorders();
  }

  @Get(':id')
  getordersbyid(@Param('id') id: string) {
    return this.orderService.getordersbyid(Number(id));
  }

  @Post()
  createorder(
    @Body()body: {vendor_id: number,customer_name: string,address: string,coordinates: string,time_window: string,priority: string,weight: number,notes: string,status: string},
  ) {
    return this.orderService.createorder(body);
  }

  @Patch(':id')
  updateorder(
    @Param('id') id: string, @Body()
    body: {vendor_id: number,customer_name: string, address: string,coordinates: string,time_window: string,priority: string,weight: number,notes: string,status: string},
  ) {
    return this.orderService.updateorder(Number(id), body);
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.orderService.updateOrderStatus(
      Number(id),
      body.status,
    );
  }

  @Delete(':id')
  deleteOrder(@Param('id') id: string) {
    return this.orderService.deleteOrder(Number(id));
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importOrders(@UploadedFile() file: Express.Multer.File) {
    return this.orderService.importOrders(file);
  }

  @Post('validate')
  @UseInterceptors(FileInterceptor('file'))
  validateOrders(@UploadedFile() file: Express.Multer.File) {
    return this.orderService.validateOrders(file);
  }
}
