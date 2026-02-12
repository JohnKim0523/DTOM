import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './entities/follow.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
  ) {}

  async follow(followerId: string, followingId: string): Promise<Follow> {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    if (existing) {
      throw new ConflictException('Already following this user');
    }
    const follow = this.followRepo.create({ followerId, followingId });
    return this.followRepo.save(follow);
  }

  async unfollow(followerId: string, followingId: string): Promise<void> {
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    if (!existing) {
      throw new NotFoundException('Not following this user');
    }
    await this.followRepo.remove(existing);
  }

  async getFollowers(userId: string): Promise<Follow[]> {
    return this.followRepo.find({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });
  }

  async getFollowing(userId: string): Promise<Follow[]> {
    return this.followRepo.find({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
    });
  }

  async getCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [followers, following] = await Promise.all([
      this.followRepo.count({ where: { followingId: userId } }),
      this.followRepo.count({ where: { followerId: userId } }),
    ]);
    return { followers, following };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const count = await this.followRepo.count({
      where: { followerId, followingId },
    });
    return count > 0;
  }
}
