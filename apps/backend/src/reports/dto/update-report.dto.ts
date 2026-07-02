import { ReportStatus } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateReportDto {
  @IsEnum(ReportStatus)
  status!: ReportStatus;

  @IsBoolean()
  @IsOptional()
  suspendReportedUser?: boolean;
}
