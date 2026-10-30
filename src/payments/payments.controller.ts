import {
  Body,
  Controller,
  Get,
  Ip,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../users/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type {
  IpnResponse,
  PaymentLink,
  PaymentReturnResult,
  VnpayParams,
} from './payments.interface';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiOperation({ summary: 'Create a VNPay payment link for my booking' })
  @ApiSecurity('token')
  @UseGuards(JwtAuthGuard)
  @Post()
  createPayment(
    @CurrentUser() user: User,
    @Body() dto: CreatePaymentDto,
    @Ip() ip: string,
  ): Promise<PaymentLink> {
    return this.paymentsService.create(user.id, dto.bookingId, ip);
  }

  @ApiOperation({ summary: 'VNPay server-to-server payment notification' })
  @Get('vnpay/ipn')
  receiveVnpayIpn(@Query() query: VnpayParams): Promise<IpnResponse> {
    return this.paymentsService.handleIpn(query);
  }

  @ApiOperation({ summary: 'VNPay redirect after the user pays' })
  @Get('vnpay/return')
  getVnpayReturn(@Query() query: VnpayParams): PaymentReturnResult {
    return this.paymentsService.handleReturn(query);
  }
}
