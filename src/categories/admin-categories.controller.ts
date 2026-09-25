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
import { Paginated } from '../common/pagination.interface';
import { UserRole } from '../users/user.entity';
import { CategoriesService } from './categories.service';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@ApiTags('admin/categories')
@ApiSecurity('token')
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminCategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @ApiOperation({ summary: '[Admin] List categories' })
  @Get()
  findAll(
    @Query() query: ListCategoriesQueryDto,
  ): Promise<Paginated<Category>> {
    return this.categoriesService.findAll(query);
  }

  @ApiOperation({ summary: '[Admin] Get a category by id' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.findByIdOrThrow(id);
  }

  @ApiOperation({ summary: '[Admin] Create a category' })
  @Post()
  create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(dto);
  }

  @ApiOperation({ summary: '[Admin] Update a category' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a category' })
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.remove(id);
  }
}
