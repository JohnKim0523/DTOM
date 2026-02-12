import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepo: Repository<Friendship>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async sendRequest(requesterId: string, addresseeId: string): Promise<Friendship> {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const existing = await this.friendshipRepo
      .createQueryBuilder('f')
      .where(
        '(f.requesterId = :a AND f.addresseeId = :b) OR (f.requesterId = :b AND f.addresseeId = :a)',
        { a: requesterId, b: addresseeId },
      )
      .getOne();

    if (existing) {
      throw new ConflictException('A friendship or request already exists between these users');
    }

    const friendship = this.friendshipRepo.create({
      requesterId,
      addresseeId,
      status: FriendshipStatus.PENDING,
    });
    const saved = await this.friendshipRepo.save(friendship);
    await this.notificationsService.create(
      addresseeId,
      NotificationType.FRIEND_REQUEST,
      'sent you a friend request',
      requesterId,
      saved.id,
    );
    return saved;
  }

  async acceptRequest(friendshipId: string, userId: string): Promise<Friendship> {
    const friendship = await this.friendshipRepo.findOne({
      where: { id: friendshipId },
    });
    if (!friendship) throw new NotFoundException('Friend request not found');
    if (friendship.addresseeId !== userId) {
      throw new ForbiddenException('Only the addressee can accept this request');
    }
    friendship.status = FriendshipStatus.ACCEPTED;
    const saved = await this.friendshipRepo.save(friendship);
    await this.notificationsService.create(
      friendship.requesterId,
      NotificationType.FRIEND_ACCEPTED,
      'accepted your friend request',
      userId,
      saved.id,
    );
    return saved;
  }

  async remove(friendshipId: string, userId: string): Promise<void> {
    const friendship = await this.friendshipRepo.findOne({
      where: { id: friendshipId },
    });
    if (!friendship) throw new NotFoundException('Friendship not found');
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      throw new ForbiddenException('You are not part of this friendship');
    }
    await this.friendshipRepo.remove(friendship);
  }

  async listFriends(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { addresseeId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
      order: { createdAt: 'DESC' },
    });
  }

  async listPendingRequests(userId: string): Promise<Friendship[]> {
    return this.friendshipRepo.find({
      where: { addresseeId: userId, status: FriendshipStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });
  }

  async getStatus(
    userId: string,
    otherUserId: string,
  ): Promise<{ status: string | null; friendshipId: string | null; direction: string | null }> {
    const friendship = await this.friendshipRepo
      .createQueryBuilder('f')
      .where(
        '(f.requesterId = :a AND f.addresseeId = :b) OR (f.requesterId = :b AND f.addresseeId = :a)',
        { a: userId, b: otherUserId },
      )
      .getOne();

    if (!friendship) return { status: null, friendshipId: null, direction: null };

    const direction = friendship.requesterId === userId ? 'outgoing' : 'incoming';
    return { status: friendship.status, friendshipId: friendship.id, direction };
  }
}
