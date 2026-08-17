import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { RoutesService } from './routes.service';

@Controller('api/routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('summary')
  getSummary() {
    return this.routesService.getSummary();
  }

  @Get()
  findAll(@Query() query: any) {
    return this.routesService.findAll(query);
  }

  @Post('optimize')
  optimizePlaceholder(@Body() body: any) {
    return this.routesService.optimizePlaceholder(body);
  }

  @Get(':routeId')
  findOne(@Param('routeId') routeId: string) {
    return this.routesService.findOne(routeId);
  }

  @Get(':routeId/map')
  getMap(@Param('routeId') routeId: string) {
    return this.routesService.getMap(routeId);
  }

  @Patch(':routeId/driver')
  assignDriver(@Param('routeId') routeId: string, @Body('driverId') driverId: string) {
    return this.routesService.assignDriver(routeId, driverId);
  }

  @Patch(':routeId/vehicle')
  assignVehicle(@Param('routeId') routeId: string, @Body('vehicleId') vehicleId: string) {
    return this.routesService.assignVehicle(routeId, vehicleId);
  }

  @Patch(':routeId/status')
  updateStatus(@Param('routeId') routeId: string, @Body('status') status: string) {
    return this.routesService.updateStatus(routeId, status);
  }

  @Post(':routeId/dispatch')
  dispatch(@Param('routeId') routeId: string) {
    return this.routesService.dispatch(routeId);
  }

  @Post()
  createRoute(@Body() data: any) {
    return this.routesService.createRoute(data);
  }
}
