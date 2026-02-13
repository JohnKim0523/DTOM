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
import { Thread } from '../../threads/entities/thread.entity';
import { TopicComment } from './topic-comment.entity';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  threadId: string;

  @ManyToOne(() => Thread, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'threadId' })
  thread: Thread;

  @Column()
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ default: 0 })
  score: number;

  @OneToMany(() => TopicComment, (comment) => comment.topic)
  comments: TopicComment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
