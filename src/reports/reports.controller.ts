import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
  ) {}

  @Get('daily')
  getDailyReport(@Query('date') date: string) {
    return this.reportsService.getDailyDeliverySummary(date);
  }

  @Get('weekly')
  getWeeklyReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getWeeklyDeliverySummary(
      startDate,
      endDate,
    );
  }

  @Get('drivers')
  getDriverPerformance() {
    return this.reportsService.getDriverPerformance();
  }

  @Get('on-time')
  getOnTimeRate() {
    return this.reportsService.getOnTimeRate();
  }

  @Get('routes')
  getRouteEfficiency() {
    return this.reportsService.getRouteEfficiency();
  }
}