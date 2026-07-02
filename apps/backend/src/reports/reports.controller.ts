import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  createReport(@Body() dto: CreateReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reports.createReport(dto, user);
  }

  @Get()
  listReports(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.listReports(user);
  }

  @Patch(':id')
  updateReport(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reports.updateReport(id, dto, user);
  }
}
