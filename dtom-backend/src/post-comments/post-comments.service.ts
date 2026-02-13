import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { PostComment } from './entities/post-comment.entity';
import { CreatePostCommentDto } from './dto/create-post-comment.dto';
import { Post } from '../posts/entities/post.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class PostCommentsService {
  constructor(
    @InjectRepository(PostComment)
    private readonly commentsRepo: Repository<PostComment>,
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(
    postId: string,
    dto: CreatePostCommentDto,
    userId: string,
    imageUrl?: string,
  ): Promise<PostComment> {
    const post = await this.postsRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (dto.parentId) {
      const parent = await this.commentsRepo.findOne({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent comment not found');
      if (parent.postId !== postId) {
        throw new BadRequestException('Parent comment does not belong to this post');
      }
      if (parent.parentId) {
        throw new BadRequestException('Cannot reply to a reply (only one level of nesting allowed)');
      }
    }

    const comment = this.commentsRepo.create({
      content: dto.content,
      postId,
      authorId: userId,
      parentId: dto.parentId || null,
      imageUrl: imageUrl || null,
    });
    const saved = await this.commentsRepo.save(comment);

    // Notify post author
    if (post.authorId !== userId) {
      await this.notificationsService.create(
        post.authorId,
        NotificationType.POST_COMMENT,
        'commented on your post',
        userId,
        postId,
      );
    }

    // Notify parent comment author (if replying)
    if (dto.parentId) {
      const parent = await this.commentsRepo.findOne({ where: { id: dto.parentId } });
      if (parent && parent.authorId !== userId && parent.authorId !== post.authorId) {
        await this.notificationsService.create(
          parent.authorId,
          NotificationType.POST_COMMENT,
          'replied to your comment',
          userId,
          postId,
        );
      }
    }

    return saved;
  }

  async findByPost(postId: string): Promise<PostComment[]> {
    return this.commentsRepo.find({
      where: { postId, parentId: IsNull() },
      relations: ['author', 'replies', 'replies.author'],
      order: { createdAt: 'ASC' },
    });
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentsRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    const post = await this.postsRepo.findOne({ where: { id: comment.postId } });
    const isAuthor = comment.authorId === userId;
    const isPostAuthor = post && post.authorId === userId;

    if (!isAuthor && !isPostAuthor) {
      throw new ForbiddenException('Only the comment author or post author can delete this comment');
    }

    await this.commentsRepo.remove(comment);
  }

  async countByPost(postId: string): Promise<number> {
    return this.commentsRepo.count({ where: { postId } });
  }
}
