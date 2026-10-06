import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Paginated } from '../common/pagination/pagination.interface';
import { UserRole } from '../users/user-role.enum';
import { AdminToursService } from './admin-tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { ToursFilterQueryDto } from './dto/tours-filter-query.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { Tour } from './tour.entity';

@ApiTags('admin/tours')
@ApiSecurity('token')
@Controller('admin/tours')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminToursController {
  constructor(private readonly adminToursService: AdminToursService) {}

  @ApiOperation({ summary: '[Admin] List tours' })
  @Get()
  getTours(@Query() query: ToursFilterQueryDto): Promise<Paginated<Tour>> {
    return this.adminToursService.findAll(query);
  }

  @ApiOperation({ summary: '[Admin] Get a tour by id' })
  @Get(':id')
  getTour(@Param('id', ParseIntPipe) id: number): Promise<Tour> {
    return this.adminToursService.findByIdOrThrow(id);
  }

  @ApiOperation({ summary: '[Admin] Create a tour with its itinerary' })
  @Post()
  createTour(@Body() dto: CreateTourDto): Promise<Tour> {
    return this.adminToursService.create(dto);
  }

  @ApiOperation({ summary: '[Admin] Update a tour' })
  @Patch(':id')
  updateTour(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTourDto,
  ): Promise<Tour> {
    return this.adminToursService.update(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Soft delete a tour' })
  @Delete(':id')
  @HttpCode(204)
  async deleteTour(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.adminToursService.remove(id);
  }
}
