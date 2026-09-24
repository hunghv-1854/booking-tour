import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import type {
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
  TokenPair,
} from './auth.types';
import { AuthToken } from './decorators/auth-token.decorator';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
