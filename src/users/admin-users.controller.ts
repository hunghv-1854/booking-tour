import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Paginated } from '../common/pagination.interface';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User, UserRole } from './user.entity';
import { UsersService } from './users.service';

@ApiTags('admin/users')
@ApiSecurity('token')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: '[Admin] List users' })
  @Get()
  findAll(@Query() query: ListUsersQueryDto): Promise<Paginated<User>> {
    return this.usersService.findAll(query);
  }

  @ApiOperation({ summary: '[Admin] Get a user by id' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findByIdOrThrow(id);
  }

  @ApiOperation({ summary: "[Admin] Update a user's role/status" })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserRoleDto,
  ): Promise<User> {
    return this.usersService.updateRoleStatus(id, dto);
  }

  @ApiOperation({ summary: '[Admin] Delete a user' })
  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.usersService.deleteById(id);
  }
}
