import { LocationVisibility } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  avatarUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  country?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string | null;

  @IsOptional()
  @IsEnum(LocationVisibility)
  locationVisibility?: LocationVisibility;

  @IsOptional()
  @IsBoolean()
  showOnlineStatus?: boolean;
}
