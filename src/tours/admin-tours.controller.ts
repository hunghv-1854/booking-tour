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
  ParseUUIDPipe,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AttachableType } from '../attachments/attachable-type.enum';
import { MAX_TOUR_IMAGES_PER_REQUEST } from '../attachments/attachments.constants';
import { imageUploadOptions } from '../attachments/image-upload.options';
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
import {
  CREATE_TOUR_FORM_SCHEMA,
  TOUR_IMAGES_BODY_SCHEMA,
} from './tours.constants';
import { AdminTourDetail } from './tours.interface';

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
  getTour(@Param('id', ParseIntPipe) id: number): Promise<AdminTourDetail> {
    return this.adminToursService.findByIdOrThrow(id);
  }

  @ApiOperation({
    summary: '[Admin] Create a tour with its itinerary and images',
    description:
      'Accepts multipart/form-data (with images) or application/json (without images).',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: CREATE_TOUR_FORM_SCHEMA })
  @Post()
  @UseInterceptors(
    FilesInterceptor(
      'images',
      MAX_TOUR_IMAGES_PER_REQUEST,
      imageUploadOptions(AttachableType.TOUR_IMAGE),
    ),
  )
  createTour(
    @Body() dto: CreateTourDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<AdminTourDetail> {
    return this.adminToursService.create(dto, images);
  }

  @ApiOperation({ summary: '[Admin] Upload more images for a tour' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: TOUR_IMAGES_BODY_SCHEMA })
  @Post(':id/images')
  @UseInterceptors(
    FilesInterceptor(
      'images',
      MAX_TOUR_IMAGES_PER_REQUEST,
      imageUploadOptions(AttachableType.TOUR_IMAGE),
    ),
  )
  uploadTourImages(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<AdminTourDetail> {
    return this.adminToursService.addImages(id, images);
  }

  @ApiOperation({ summary: '[Admin] Delete a tour image' })
  @Delete(':id/images/:imageId')
  @HttpCode(204)
  async deleteTourImage(
    @Param('id', ParseIntPipe) id: number,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<void> {
    await this.adminToursService.removeImage(id, imageId);
  }

  @ApiOperation({ summary: '[Admin] Update a tour' })
  @Patch(':id')
  updateTour(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTourDto,
  ): Promise<AdminTourDetail> {
    return this.adminToursService.update(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Soft delete a tour' })
  @Delete(':id')
  @HttpCode(204)
  async deleteTour(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.adminToursService.remove(id);
  }
}
