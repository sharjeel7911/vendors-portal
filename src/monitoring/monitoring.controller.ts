import { Controller, Get, Param } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';

@Controller('monitoring')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
  ) {}


  @Get('drivers')
  getDriverLocations() {
    return this.monitoringService.getDriverLocations();
  }

  @Get('deliveries')
  getDeliveryProgress() {
    return this.monitoringService.getDeliveryProgress();
  }


  @Get('deliveries/status/:status')
  getDeliveryStatus(@Param('status') status: string) {
    return this.monitoringService.getDeliveryStatus(status);
  }

  @Get('delayed')
  getDelayedDeliveries() {
    return this.monitoringService.getDelayedDeliveries();
  }

  @Get('failed')
  getFailedDeliveries() {
    return this.monitoringService.getFailedDeliveries();
  }

  @Get('alerts')
  getAlerts() {
    return this.monitoringService.getAlerts();
  }
}
