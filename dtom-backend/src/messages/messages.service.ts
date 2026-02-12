import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private readonly messagesRepo: Repository<Message>,
  ) {}

  async send(senderId: string, receiverId: string, content: string): Promise<Message> {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send a message to yourself');
    }
    const message = this.messagesRepo.create({ senderId, receiverId, content });
    return this.messagesRepo.save(message);
  }

  async getConversation(userId: string, otherUserId: string, limit = 50, before?: string): Promise<Message[]> {
    const qb = this.messagesRepo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.receiver', 'receiver')
      .where(
        '(m.senderId = :userId AND m.receiverId = :otherUserId) OR (m.senderId = :otherUserId AND m.receiverId = :userId)',
        { userId, otherUserId },
      );

    if (before) {
      qb.andWhere('m.createdAt < :before', { before });
    }

    return qb
      .orderBy('m.createdAt', 'DESC')
      .limit(limit)
      .getMany()
      .then(msgs => msgs.reverse());
  }

  async listConversations(userId: string): Promise<any[]> {
    // Get the latest message for each conversation partner
    const raw = await this.messagesRepo
      .createQueryBuilder('m')
      .where('m.senderId = :userId OR m.receiverId = :userId', { userId })
      .orderBy('m.createdAt', 'DESC')
      .leftJoinAndSelect('m.sender', 'sender')
      .leftJoinAndSelect('m.receiver', 'receiver')
      .getMany();

    // Group by conversation partner, keep only latest
    const seen = new Map<string, any>();
    for (const msg of raw) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!seen.has(partnerId)) {
        const partner = msg.senderId === userId ? msg.receiver : msg.sender;
        seen.set(partnerId, {
          partnerId,
          partner,
          lastMessage: msg,
          lastMessageAt: msg.createdAt,
        });
      }
    }

    // Attach unread counts
    const conversations = Array.from(seen.values());
    for (const conv of conversations) {
      conv.unreadCount = await this.messagesRepo.count({
        where: {
          senderId: conv.partnerId,
          receiverId: userId,
          read: false,
        },
      });
    }

    return conversations;
  }

  async markConversationRead(userId: string, otherUserId: string): Promise<void> {
    await this.messagesRepo
      .createQueryBuilder()
      .update(Message)
      .set({ read: true })
      .where('receiverId = :userId AND senderId = :otherUserId AND read = false', {
        userId,
        otherUserId,
      })
      .execute();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messagesRepo.count({
      where: { receiverId: userId, read: false },
    });
  }
}
