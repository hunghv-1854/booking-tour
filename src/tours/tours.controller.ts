import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Paginated } from '../common/pagination/pagination.interface';
import { ListToursQueryDto } from './dto/list-tours-query.dto';
import { SearchToursQueryDto } from './dto/search-tours-query.dto';
import { TourDetail, TourListItem, TourSearchItem } from './tours.interface';
import { ToursService } from './tours.service';

@ApiTags('tours')
@Controller('tours')
export class ToursController {
  constructor(private readonly toursService: ToursService) {}

  @ApiOperation({ summary: 'List available tours' })
  @Get()
  getTours(
    @Query() query: ListToursQueryDto,
  ): Promise<Paginated<TourListItem>> {
    return this.toursService.findAll(query);
  }

  @ApiOperation({ summary: 'Search tours by start/end date' })
  @Get('search')
  searchTours(
    @Query() query: SearchToursQueryDto,
  ): Promise<Paginated<TourSearchItem>> {
    return this.toursService.search(query);
  }

  @ApiOperation({ summary: 'Get tour detail' })
  @Get(':id')
  getTourDetail(@Param('id', ParseIntPipe) id: number): Promise<TourDetail> {
    return this.toursService.findDetail(id);
  }
}
