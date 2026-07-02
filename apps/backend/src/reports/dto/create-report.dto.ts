import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  reportedUserId!: string;

  @IsOptional()
  @IsUUID()
  messageId?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}
