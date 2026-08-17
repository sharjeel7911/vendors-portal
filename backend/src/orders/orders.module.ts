import { Module } from '@nestjs/common';
import { OrdersController, StopsController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrdersController, StopsController],
  providers: [OrdersService]
})
export class OrdersModule {}
