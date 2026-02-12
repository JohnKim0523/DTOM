import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';

export enum MemberRole {
  ATTENDEE = 'attendee',
  MODERATOR = 'moderator',
  INVITED = 'invited',
}

@Entity('event_members')
@Unique(['userId', 'eventId'])
export class EventMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ type: 'enum', enum: MemberRole, default: MemberRole.ATTENDEE })
  role: MemberRole;

  @CreateDateColumn()
  joinedAt: Date;
}
