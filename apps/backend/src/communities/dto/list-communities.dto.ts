import { CommunityType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class ListCommunitiesDto {
  @IsOptional()
  @IsEnum(CommunityType)
  type?: CommunityType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;
}
