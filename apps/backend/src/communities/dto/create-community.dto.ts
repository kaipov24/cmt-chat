import { CommunityType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class CreateCommunityDto {
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  name!: string;

  @IsEnum(CommunityType)
  type!: CommunityType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ValidateIf((dto: CreateCommunityDto) => dto.type === 'country' || dto.type === 'city')
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  country?: string;

  @ValidateIf((dto: CreateCommunityDto) => dto.type === 'city')
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city?: string;
}
