import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostCommentsService } from './post-comments.service';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { commentImageStorage } from '../config/cloudinary.config';

@UseGuards(JwtAuthGuard)
@Controller()
export class PostCommentsController {
  constructor(private readonly postCommentsService: PostCommentsService) {}

  @Post('posts/:postId/comments')
  async create(
    @Param('postId') postId: string,
    @Body() dto: CreatePostCommentDto,
    @CurrentUser() user: User,
  ) {
    return this.postCommentsService.create(postId, dto, user.id);
  }

  @Post('posts/:postId/comments/image')
  @UseInterceptors(FileInterceptor('image', { storage: commentImageStorage }))
  async createWithImage(
    @Param('postId') postId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreatePostCommentDto,
    @CurrentUser() user: User,
  ) {
    const imageUrl = (file as any)?.path || null;
    return this.postCommentsService.create(postId, dto, user.id, imageUrl);
  }

  @Get('posts/:postId/comments')
  async findAll(@Param('postId') postId: string) {
    return this.postCommentsService.findByPost(postId);
  }

  @Delete('post-comments/:commentId')
  async remove(
    @Param('commentId') commentId: string,
    @CurrentUser() user: User,
  ) {
    await this.postCommentsService.remove(commentId, user.id);
    return { deleted: true };
  }
}
