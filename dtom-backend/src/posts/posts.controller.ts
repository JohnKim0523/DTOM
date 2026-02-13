import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { postImageStorage } from '../config/cloudinary.config';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  async getFeed(@CurrentUser() user: User, @Query('page') page?: string) {
    return this.postsService.getFeed(user.id, page ? parseInt(page, 10) : 1);
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/:userId')
  async getUserPosts(@Param('userId') userId: string, @Query('page') page?: string) {
    return this.postsService.getUserPosts(userId, page ? parseInt(page, 10) : 1);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTextPost(@Body() dto: CreatePostDto, @CurrentUser() user: User) {
    return this.postsService.createTextPost(user.id, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post('image')
  @UseInterceptors(FileInterceptor('image', { storage: postImageStorage }))
  async createImagePost(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreatePostDto,
    @CurrentUser() user: User,
  ) {
    if (!file) throw new BadRequestException('Image file is required');
    const imageUrl = file.path;
    return this.postsService.createImagePost(user.id, imageUrl, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Post('repost/:eventId')
  async createRepost(@Param('eventId') eventId: string, @CurrentUser() user: User) {
    return this.postsService.createRepost(user.id, eventId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(@Param('id') id: string, @CurrentUser() user: User) {
    await this.postsService.deletePost(id, user.id);
    return { deleted: true };
  }
}
