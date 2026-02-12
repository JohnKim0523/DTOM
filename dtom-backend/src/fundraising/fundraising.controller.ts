import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FundraisingService } from './fundraising.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('events/:eventId/fundraising')
export class FundraisingController {
  constructor(private readonly fundraisingService: FundraisingService) {}

  @Post('contribute')
  async contribute(
    @Param('eventId') eventId: string,
    @Body('amount') amount: number,
    @CurrentUser() user: User,
  ) {
    return this.fundraisingService.contribute(eventId, user.id, amount);
  }

  @Get('contributions')
  async listContributions(@Param('eventId') eventId: string) {
    return this.fundraisingService.listByEvent(eventId);
  }
}
