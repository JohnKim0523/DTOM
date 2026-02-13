import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Topic } from './entities/topic.entity';
import { TopicComment } from './entities/topic-comment.entity';
import { Vote, VoteTargetType } from './entities/vote.entity';
import { Thread, ThreadPermission, ThreadType } from '../threads/entities/thread.entity';
import { CreateTopicDto } from './dto/create-topic.dto';
import { CreateTopicCommentDto } from './dto/create-topic-comment.dto';
import { EventMembersService } from '../event-members/event-members.service';
import { EventsService } from '../events/events.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class TopicsService {
  constructor(
    @InjectRepository(Topic)
    private readonly topicsRepository: Repository<Topic>,
    @InjectRepository(TopicComment)
    private readonly topicCommentsRepository: Repository<TopicComment>,
    @InjectRepository(Vote)
    private readonly votesRepository: Repository<Vote>,
    @InjectRepository(Thread)
    private readonly threadsRepository: Repository<Thread>,
    private readonly membersService: EventMembersService,
    private readonly eventsService: EventsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // --- Topics ---

  async createTopic(
    threadId: string,
    dto: CreateTopicDto,
    userId: string,
    imageUrl?: string,
  ): Promise<Topic> {
    const thread = await this.threadsRepository.findOne({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    if (thread.type !== ThreadType.COMMUNITY) {
      throw new BadRequestException('Topics can only be created in community threads');
    }
    if (thread.permission === ThreadPermission.LOCKED) {
      throw new ForbiddenException('This thread is locked');
    }

    await this.assertMember(thread.eventId, userId);

    if (thread.permission === ThreadPermission.READONLY) {
      const event = await this.eventsService.findOne(thread.eventId);
      const isOrganizer = event.organizerId === userId;
      const memberRole = await this.membersService.getMemberRole(thread.eventId, userId);
      const isModerator = memberRole === 'moderator';
      if (!isOrganizer && !isModerator) {
        throw new ForbiddenException('Only organizers and moderators can create topics in readonly threads');
      }
    }

    const topic = this.topicsRepository.create({
      title: dto.title,
      content: dto.content,
      imageUrl: imageUrl || null,
      threadId,
      authorId: userId,
    });
    const saved = await this.topicsRepository.save(topic);
    return this.topicsRepository.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });
  }

  async findTopicsByThread(
    threadId: string,
    userId: string,
    sort: 'top' | 'new' = 'new',
  ): Promise<any[]> {
    const thread = await this.threadsRepository.findOne({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Thread not found');
    await this.assertMember(thread.eventId, userId);

    const order: any = sort === 'top'
      ? { score: 'DESC', createdAt: 'DESC' }
      : { createdAt: 'DESC' };

    const topics = await this.topicsRepository.find({
      where: { threadId },
      relations: ['author'],
      order,
    });

    const result = [];
    for (const topic of topics) {
      const commentCount = await this.topicCommentsRepository.count({
        where: { topicId: topic.id },
      });
      const vote = await this.votesRepository.findOne({
        where: { userId, targetType: VoteTargetType.TOPIC, targetId: topic.id },
      });
      result.push({
        ...topic,
        commentCount,
        userVoted: !!vote,
      });
    }
    return result;
  }

  async deleteTopic(topicId: string, userId: string): Promise<void> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
      relations: ['thread'],
    });
    if (!topic) throw new NotFoundException('Topic not found');

    const event = await this.eventsService.findOne(topic.thread.eventId);
    const isOrganizer = event.organizerId === userId;
    const isAuthor = topic.authorId === userId;
    const memberRole = await this.membersService.getMemberRole(topic.thread.eventId, userId);
    const isModerator = memberRole === 'moderator';

    if (!isAuthor && !isOrganizer && !isModerator) {
      throw new ForbiddenException('Only the author, organizer, or a moderator can delete this topic');
    }

    await this.topicsRepository.remove(topic);
  }

  // --- Topic Comments ---

  async createTopicComment(
    topicId: string,
    dto: CreateTopicCommentDto,
    userId: string,
    imageUrl?: string,
  ): Promise<TopicComment> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
      relations: ['thread'],
    });
    if (!topic) throw new NotFoundException('Topic not found');

    const thread = topic.thread;
    if (thread.permission === ThreadPermission.LOCKED) {
      throw new ForbiddenException('This thread is locked');
    }

    await this.assertMember(thread.eventId, userId);

    if (dto.parentId) {
      const parent = await this.topicCommentsRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
      if (parent.topicId !== topicId) {
        throw new BadRequestException('Parent comment does not belong to this topic');
      }
      if (parent.parentId) {
        throw new BadRequestException('Cannot reply to a reply — only one level of nesting is allowed');
      }
    }

    const comment = this.topicCommentsRepository.create({
      content: dto.content,
      imageUrl: imageUrl || null,
      topicId,
      authorId: userId,
      parentId: dto.parentId || null,
    });
    const saved = await this.topicCommentsRepository.save(comment);

    // Notify topic author
    if (topic.authorId !== userId) {
      await this.notificationsService.create(
        topic.authorId,
        NotificationType.TOPIC_COMMENT,
        `commented on your topic "${topic.title}"`,
        userId,
        topicId,
      );
    }

    // Notify parent comment author
    if (dto.parentId) {
      const parent = await this.topicCommentsRepository.findOne({
        where: { id: dto.parentId },
      });
      if (parent && parent.authorId !== userId && parent.authorId !== topic.authorId) {
        await this.notificationsService.create(
          parent.authorId,
          NotificationType.TOPIC_COMMENT,
          `replied to your comment on "${topic.title}"`,
          userId,
          topicId,
        );
      }
    }

    return this.topicCommentsRepository.findOne({
      where: { id: saved.id },
      relations: ['author'],
    });
  }

  async findCommentsByTopic(topicId: string, userId: string): Promise<any[]> {
    const topic = await this.topicsRepository.findOne({
      where: { id: topicId },
      relations: ['thread'],
    });
    if (!topic) throw new NotFoundException('Topic not found');
    await this.assertMember(topic.thread.eventId, userId);

    const topLevelComments = await this.topicCommentsRepository.find({
      where: { topicId, parentId: null as any },
      relations: ['author', 'replies', 'replies.author'],
      order: { score: 'DESC', createdAt: 'DESC' },
    });

    const result = [];
    for (const comment of topLevelComments) {
      const vote = await this.votesRepository.findOne({
        where: { userId, targetType: VoteTargetType.TOPIC_COMMENT, targetId: comment.id },
      });
      const replies = [];
      if (comment.replies) {
        for (const reply of comment.replies) {
          const replyVote = await this.votesRepository.findOne({
            where: { userId, targetType: VoteTargetType.TOPIC_COMMENT, targetId: reply.id },
          });
          replies.push({ ...reply, userVoted: !!replyVote });
        }
        replies.sort((a: any, b: any) => b.score - a.score || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      result.push({
        ...comment,
        replies,
        userVoted: !!vote,
      });
    }
    return result;
  }

  async deleteTopicComment(commentId: string, userId: string): Promise<void> {
    const comment = await this.topicCommentsRepository.findOne({
      where: { id: commentId },
      relations: ['topic', 'topic.thread'],
    });
    if (!comment) throw new NotFoundException('Comment not found');

    const event = await this.eventsService.findOne(comment.topic.thread.eventId);
    const isOrganizer = event.organizerId === userId;
    const isAuthor = comment.authorId === userId;
    const memberRole = await this.membersService.getMemberRole(comment.topic.thread.eventId, userId);
    const isModerator = memberRole === 'moderator';

    if (!isAuthor && !isOrganizer && !isModerator) {
      throw new ForbiddenException('Only the author, organizer, or a moderator can delete this comment');
    }

    await this.topicCommentsRepository.remove(comment);
  }

  // --- Voting ---

  async toggleVote(
    targetType: VoteTargetType,
    targetId: string,
    userId: string,
  ): Promise<{ score: number; voted: boolean }> {
    // Verify target exists and user is a member
    if (targetType === VoteTargetType.TOPIC) {
      const topic = await this.topicsRepository.findOne({
        where: { id: targetId },
        relations: ['thread'],
      });
      if (!topic) throw new NotFoundException('Topic not found');
      if (topic.thread.permission === ThreadPermission.LOCKED) {
        throw new ForbiddenException('This thread is locked');
      }
      await this.assertMember(topic.thread.eventId, userId);
    } else {
      const comment = await this.topicCommentsRepository.findOne({
        where: { id: targetId },
        relations: ['topic', 'topic.thread'],
      });
      if (!comment) throw new NotFoundException('Comment not found');
      if (comment.topic.thread.permission === ThreadPermission.LOCKED) {
        throw new ForbiddenException('This thread is locked');
      }
      await this.assertMember(comment.topic.thread.eventId, userId);
    }

    const existing = await this.votesRepository.findOne({
      where: { userId, targetType, targetId },
    });

    if (existing) {
      await this.votesRepository.remove(existing);
      if (targetType === VoteTargetType.TOPIC) {
        await this.topicsRepository.decrement({ id: targetId }, 'score', 1);
        const topic = await this.topicsRepository.findOne({ where: { id: targetId } });
        return { score: topic.score, voted: false };
      } else {
        await this.topicCommentsRepository.decrement({ id: targetId }, 'score', 1);
        const comment = await this.topicCommentsRepository.findOne({ where: { id: targetId } });
        return { score: comment.score, voted: false };
      }
    } else {
      const vote = this.votesRepository.create({ userId, targetType, targetId });
      await this.votesRepository.save(vote);
      if (targetType === VoteTargetType.TOPIC) {
        await this.topicsRepository.increment({ id: targetId }, 'score', 1);
        const topic = await this.topicsRepository.findOne({ where: { id: targetId } });
        return { score: topic.score, voted: true };
      } else {
        await this.topicCommentsRepository.increment({ id: targetId }, 'score', 1);
        const comment = await this.topicCommentsRepository.findOne({ where: { id: targetId } });
        return { score: comment.score, voted: true };
      }
    }
  }

  private async assertMember(eventId: string, userId: string): Promise<void> {
    const event = await this.eventsService.findOne(eventId);
    if (event.organizerId === userId) return;
    const isMember = await this.membersService.isMember(eventId, userId);
    if (!isMember) {
      throw new ForbiddenException('You must be a member of this event');
    }
  }
}
