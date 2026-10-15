import {
  Body,
  Controller,
  Get,
  Patch,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AttachableType } from '../attachments/attachable-type.enum';
import { imageUploadOptions } from '../attachments/image-upload.options';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './user.entity';
import { UserProfile } from './users.interface';
import { UsersService } from './users.service';
import { UPDATE_PROFILE_BODY_SCHEMA } from './users.constants';

@ApiTags('users')
@ApiSecurity('token')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get the currently authenticated user' })
  @Get('me')
  getCurrentUser(@CurrentUser() user: User): Promise<UserProfile> {
    return this.usersService.getProfile(user.id);
  }

  @ApiOperation({ summary: 'Update my profile (fullName, phone, avatar)' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiBody({ schema: UPDATE_PROFILE_BODY_SCHEMA })
  @Patch('me')
  @UseInterceptors(
    FileInterceptor('avatar', imageUploadOptions(AttachableType.USER_AVATAR)),
  )
  updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ): Promise<UserProfile> {
    return this.usersService.updateProfile(user.id, dto, avatar);
  }
}
