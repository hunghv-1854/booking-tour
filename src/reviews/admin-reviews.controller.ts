import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Paginated } from '../common/pagination/pagination.interface';
import { UserRole } from '../users/user-role.enum';
import { AdminReviewsService } from './admin-reviews.service';
import { AdminListReviewsQueryDto } from './dto/admin-list-reviews-query.dto';
import { Review } from './review.entity';

@ApiTags('admin/reviews')
@ApiSecurity('token')
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminReviewsController {
  constructor(private readonly adminReviewsService: AdminReviewsService) {}

  @ApiOperation({ summary: '[Admin] List reviews' })
  @Get()
  getReviews(
    @Query() query: AdminListReviewsQueryDto,
  ): Promise<Paginated<Review>> {
    return this.adminReviewsService.findAll(query);
  }

  @ApiOperation({ summary: '[Admin] Delete a review' })
  @Delete(':id')
  @HttpCode(204)
  async deleteReview(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.adminReviewsService.remove(id);
  }
}
