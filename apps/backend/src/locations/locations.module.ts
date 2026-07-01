import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LocationsController } from './locations.controller';
import { LocationsService } from './locations.service';

@Module({
  controllers: [LocationsController],
  imports: [PrismaModule],
  providers: [LocationsService],
})
export class LocationsModule {}
