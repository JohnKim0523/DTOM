import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard)
@Controller('follows')
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post(':userId')
  async follow(@Param('userId') userId: string, @CurrentUser() user: User) {
    return this.followsService.follow(user.id, userId);
  }

  @Delete(':userId')
  async unfollow(@Param('userId') userId: string, @CurrentUser() user: User) {
    await this.followsService.unfollow(user.id, userId);
    return { deleted: true };
  }

  @Get(':userId/followers')
  async getFollowers(@Param('userId') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Get(':userId/following')
  async getFollowing(@Param('userId') userId: string) {
    return this.followsService.getFollowing(userId);
  }

  @Get(':userId/counts')
  async getCounts(@Param('userId') userId: string) {
    return this.followsService.getCounts(userId);
  }

  @Get(':userId/status')
  async getStatus(@Param('userId') userId: string, @CurrentUser() user: User) {
    const isFollowing = await this.followsService.isFollowing(user.id, userId);
    return { isFollowing };
  }
}
