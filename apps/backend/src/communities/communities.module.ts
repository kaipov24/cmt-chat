import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CommunitiesController } from './communities.controller';
import { CommunitiesService } from './communities.service';

@Module({
  controllers: [CommunitiesController],
  imports: [PrismaModule],
  providers: [CommunitiesService],
})
export class CommunitiesModule {}
