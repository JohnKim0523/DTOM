import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Event } from '../../events/entities/event.entity';
import { Comment } from './comment.entity';

export enum ThreadPermission {
  OPEN = 'open',
  READONLY = 'readonly',
  LOCKED = 'locked',
}

export enum ThreadType {
  CHANNEL = 'channel',
  COMMUNITY = 'community',
}

@Entity('threads')
export class Thread {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  eventId: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event: Event;

  @Column({ type: 'enum', enum: ThreadPermission, default: ThreadPermission.OPEN })
  permission: ThreadPermission;

  @Column({ type: 'enum', enum: ThreadType, default: ThreadType.CHANNEL })
  type: ThreadType;

  @Column()
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdBy' })
  creator: User;

  @OneToMany(() => Comment, (comment) => comment.thread)
  comments: Comment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
