import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { SupabaseModule } from '../supabase/supabase.module'; // adjust path to match your project

@Module({
  imports: [SupabaseModule],
  controllers: [MonitoringController],
  providers: [MonitoringService],
})
export class MonitoringModule {}
