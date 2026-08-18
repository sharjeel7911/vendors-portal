import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { DispatchService } from './dispatch.service';

@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Get('routes')
  async getDispatchedRoutes() {
    return this.dispatchService.getDispatchedRoutes();
  }

  @Get('routes/:routeId')
  async getRoute(@Param('routeId') routeId: string) {
    return this.dispatchService.getRoute(Number(routeId));
  }

  @Patch('routes/:routeId/assign')
  async assignRoute(
    @Param('routeId') routeId: string,
    @Body() body: any,
  ) {
    return this.dispatchService.assignRoute(
      Number(routeId),
      Number(body.driverId),
    );
  }

  @Patch('routes/:routeId/cancel')
  async cancelRoute(@Param('routeId') routeId: string) {
    return this.dispatchService.cancelRoute(Number(routeId));
  }

  @Patch('routes/:routeId/reoptimize')
  async reoptimizeRoute(@Param('routeId') routeId: string) {
    return this.dispatchService.reoptimizeRoute(Number(routeId));
  }

  @Patch('routes/:routeId/dispatch')
  async dispatchRoute(@Param('routeId') routeId: string) {
    return this.dispatchService.dispatchRoute(Number(routeId));
  }
}