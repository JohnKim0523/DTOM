import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThreadsService } from './threads.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { ThreadPermission } from './entities/thread.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { commentImageStorage } from '../config/cloudinary.config';

@UseGuards(JwtAuthGuard)
@Controller()
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  // --- Thread endpoints ---

  @Post('events/:eventId/threads')
  async createThread(
    @Param('eventId') eventId: string,
    @Body() dto: CreateThreadDto,
    @CurrentUser() user: User,
  ) {
    return this.threadsService.createThread(eventId, dto, user.id);
  }

  @Get('events/:eventId/threads')
  async findThreads(
    @Param('eventId') eventId: string,
    @CurrentUser() user: User,
  ) {
    return this.threadsService.findThreadsByEvent(eventId, user.id);
  }

  @Patch('threads/:threadId')
  async updateThread(
    @Param('threadId') threadId: string,
    @Body('permission') permission: ThreadPermission,
    @CurrentUser() user: User,
  ) {
    return this.threadsService.updateThreadPermission(threadId, permission, user.id);
  }

  @Delete('threads/:threadId')
  async deleteThread(
    @Param('threadId') threadId: string,
    @CurrentUser() user: User,
  ) {
    await this.threadsService.deleteThread(threadId, user.id);
    return { deleted: true };
  }

  // --- Comment endpoints ---

  @Post('events/:eventId/comments')
  async create(
    @Param('eventId') eventId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.threadsService.create(eventId, dto, user.id);
  }

  @Post('events/:eventId/comments/image')
  @UseInterceptors(FileInterceptor('image', { storage: commentImageStorage }))
  async createWithImage(
    @Param('eventId') eventId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: User,
  ) {
    const imageUrl = (file as any)?.path || null;
    return this.threadsService.create(eventId, dto, user.id, imageUrl);
  }

  @Get('events/:eventId/comments')
  async findAll(
    @Param('eventId') eventId: string,
    @Query('threadId') threadId: string | undefined,
    @CurrentUser() user: User,
  ) {
    return this.threadsService.findByEvent(eventId, user.id, threadId);
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
