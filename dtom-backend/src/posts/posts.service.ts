import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostType } from './entities/post.entity';
import { Follow } from '../follows/entities/follow.entity';
import { Event } from '../events/entities/event.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    @InjectRepository(Follow)
    private readonly followsRepository: Repository<Follow>,
    @InjectRepository(Event)
    private readonly eventsRepository: Repository<Event>,
  ) {}

  async getUserPosts(userId: string, page = 1): Promise<{ data: Post[]; total: number }> {
    const take = 20;
    const [data, total] = await this.postsRepository.findAndCount({
      where: { authorId: userId },
      relations: ['author', 'event', 'event.organizer'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * take,
      take,
    });
    return { data, total };
  }

  async createTextPost(authorId: string, content: string): Promise<Post> {
    const post = this.postsRepository.create({
      authorId,
      content,
      type: PostType.TEXT,
    });
    return this.postsRepository.save(post);
  }

  async createImagePost(authorId: string, imageUrl: string, content?: string): Promise<Post> {
    const post = this.postsRepository.create({
      authorId,
      imageUrl,
      content: content || null,
      type: PostType.IMAGE,
    });
    return this.postsRepository.save(post);
  }

  async createRepost(authorId: string, eventId: string): Promise<Post> {
    const event = await this.eventsRepository.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const post = this.postsRepository.create({
      authorId,
      eventId,
      type: PostType.REPOST,
    });
    return this.postsRepository.save(post);
  }

  async deletePost(postId: string, userId: string): Promise<void> {
    const post = await this.postsRepository.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) {
      throw new ForbiddenException('Only the author can delete this post');
    }
    await this.postsRepository.remove(post);
  }

  async getFeed(userId: string, page = 1): Promise<{ data: Post[]; total: number }> {
    const take = 20;

    const followedUsers = await this.followsRepository.find({
      where: { followerId: userId },
      select: ['followingId'],
    });

    const followingIds = followedUsers.map(f => f.followingId);

    if (followingIds.length === 0) {
      return { data: [], total: 0 };
    }

    const [data, total] = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.event', 'event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('post.authorId IN (:...ids)', { ids: followingIds })
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    return { data, total };
  }
}
