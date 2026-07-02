import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DirectMessagesController } from './direct-messages.controller';
import { DirectMessagesService } from './direct-messages.service';

@Module({
  controllers: [DirectMessagesController],
  imports: [PrismaModule],
  providers: [DirectMessagesService],
})
export class DirectMessagesModule {}
