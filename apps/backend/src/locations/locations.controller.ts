import { Controller, Get, Query } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('countries')
  listCountries() {
    return this.locations.listCountries();
  }

  @Get('cities')
  listCities(@Query('country') country?: string) {
    return this.locations.listCities(country);
  }
}
