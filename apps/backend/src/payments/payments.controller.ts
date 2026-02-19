import { Body, Controller, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('link')
  createLink(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.createPaymentLink(payload);
  }

  @Post('webhook/stripe')
  handleStripeWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.handleWebhook('stripe', payload);
  }

  @Post('webhook/paystack')
  handlePaystackWebhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.handleWebhook('paystack', payload);
  }
}
