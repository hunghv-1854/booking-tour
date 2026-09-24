import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './user.entity';
import { toAuthenticatedUser } from './users.mapper';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiSecurity('token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @Get('me')
  getCurrentUser(@CurrentUser() user: User): AuthenticatedUser {
    return toAuthenticatedUser(user);
  }

  @ApiOperation({ summary: 'Update my profile (fullName, phone)' })
  @Patch('me')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<AuthenticatedUser> {
    const updated = await this.usersService.updateProfile(user.id, dto);
    return toAuthenticatedUser(updated);
  }
}
