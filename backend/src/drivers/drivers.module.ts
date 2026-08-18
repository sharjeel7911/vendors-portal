import { Module } from '@nestjs/common';
import { DriversService } from './drivers.service';
import { DriversController } from './drivers.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from './drivers.entity';
import { Vehicle } from '../vehicles/vehicles.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Driver, Vehicle])],
  providers: [DriversService],
  controllers: [DriversController],
})
export class DriversModule {}
