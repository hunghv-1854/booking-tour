import {
  Body,
  Controller,
  Get,
  HttpCode,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type {
  ChangePasswordResponse,
  LoginResponse,
  LogoutResponse,
  PasswordResetResponse,
  OAuthProfile,
  RegisterResponse,
  TokenPair,
} from './auth.types';
import { User } from '../users/user.entity';
import { AuthToken } from './decorators/auth-token.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { CurrentOAuthProfile } from './decorators/oauth-profile.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PasswordResetService } from './password-reset.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<RegisterResponse> {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Log in with email and password' })
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(dto);
  }

  @ApiOperation({
    summary: 'Exchange a refresh token for a new access + refresh token pair',
  })
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto): Promise<TokenPair> {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Request a password reset email' })
  @Post('forgot-password')
  @HttpCode(200)
  forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<PasswordResetResponse> {
    return this.passwordResetService.requestReset(dto);
  }

  @ApiOperation({ summary: 'Set a new password with the emailed token' })
  @Post('reset-password')
  @HttpCode(200)
  resetPassword(@Body() dto: ResetPasswordDto): Promise<PasswordResetResponse> {
    return this.passwordResetService.reset(dto);
  }

  @ApiOperation({ summary: 'Change my password' })
  @ApiSecurity('token')
  @Patch('password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ): Promise<ChangePasswordResponse> {
    return this.authService.changePassword(user.id, dto);
  }

  @ApiOperation({ summary: 'Log out the current session' })
  @ApiSecurity('token')
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  logout(
    @AuthToken() token: string | null,
    @Body() dto: LogoutDto,
  ): Promise<LogoutResponse> {
    return this.authService.logout(token, dto.refreshToken);
  }

  @ApiOperation({
    summary: 'Log in with Google (open in a browser, redirects to Google)',
  })
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin(): void {}

  @ApiOperation({ summary: 'Google OAuth callback, returns the token pair' })
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(
    @CurrentOAuthProfile() profile: OAuthProfile,
  ): Promise<LoginResponse> {
    return this.authService.loginWithOAuth(profile);
  }
}
