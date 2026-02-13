import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateTopicCommentDto } from './dto/create-topic-comment.dto';
import { VoteTargetType } from './entities/vote.entity';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { commentImageStorage } from '../config/cloudinary.config';

@UseGuards(JwtAuthGuard)
@Controller()
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  // --- Topic endpoints ---

  @Post('threads/:threadId/topics')
  async createTopic(
    @Param('threadId') threadId: string,
    @Body() dto: CreateTopicDto,
    @CurrentUser() user: User,
  ) {
    return this.topicsService.createTopic(threadId, dto, user.id);
  }

  @Post('threads/:threadId/topics/image')
  @UseInterceptors(FileInterceptor('image', { storage: commentImageStorage }))
  async createTopicWithImage(
    @Param('threadId') threadId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateTopicDto,
    @CurrentUser() user: User,
  ) {
    const imageUrl = (file as any)?.path || null;
    return this.topicsService.createTopic(threadId, dto, user.id, imageUrl);
  }

  @Get('threads/:threadId/topics')
  async findTopics(
    @Param('threadId') threadId: string,
    @Query('sort') sort: 'top' | 'new',
    @CurrentUser() user: User,
  ) {
    return this.topicsService.findTopicsByThread(threadId, user.id, sort || 'new');
  }

  @Delete('topics/:topicId')
  async deleteTopic(
    @Param('topicId') topicId: string,
    @CurrentUser() user: User,
  ) {
    await this.topicsService.deleteTopic(topicId, user.id);
    return { deleted: true };
  }

  // --- Topic Comment endpoints ---

  @Post('topics/:topicId/comments')
  async createComment(
    @Param('topicId') topicId: string,
    @Body() dto: CreateTopicCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.topicsService.createTopicComment(topicId, dto, user.id);
  }

  @Post('topics/:topicId/comments/image')
  @UseInterceptors(FileInterceptor('image', { storage: commentImageStorage }))
  async createCommentWithImage(
    @Param('topicId') topicId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateTopicCommentDto,
    @CurrentUser() user: User,
  ) {
    const imageUrl = (file as any)?.path || null;
    return this.topicsService.createTopicComment(topicId, dto, user.id, imageUrl);
  }

  @Get('topics/:topicId/comments')
  async findComments(
    @Param('topicId') topicId: string,
    @CurrentUser() user: User,
  ) {
    return this.topicsService.findCommentsByTopic(topicId, user.id);
  }

  @Delete('topic-comments/:commentId')
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
  ) {
    await this.topicsService.deleteTopicComment(commentId, user.id);
    return { deleted: true };
  }

  // --- Vote endpoints ---

  @Post('topics/:topicId/vote')
  async voteTopic(
    @Param('topicId') topicId: string,
    @CurrentUser() user: User,
  ) {
    return this.topicsService.toggleVote(VoteTargetType.TOPIC, topicId, user.id);
  }

  @Post('topic-comments/:commentId/vote')
  async voteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
  ) {
    return this.topicsService.toggleVote(VoteTargetType.TOPIC_COMMENT, commentId, user.id);
  }
}
