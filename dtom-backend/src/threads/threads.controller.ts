import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller()
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post('events/:eventId/comments')
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.threadsService.create(eventId, dto, user.id);
  }

  @Get('events/:eventId/comments')
  async findAll(
    @Param('eventId') eventId: string,
    @CurrentUser() user: User,
  ) {
    return this.threadsService.findByEvent(eventId, user.id);
  }

  @Delete('comments/:commentId')
  async remove(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
  ) {
    await this.threadsService.remove(commentId, user.id);
    return { deleted: true };
  }
}
