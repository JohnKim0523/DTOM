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
import { Topic } from './topic.entity';

@Entity('topic_comments')
export class TopicComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column()
  topicId: string;

  @ManyToOne(() => Topic, (topic) => topic.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'topicId' })
  topic: Topic;

  @Column()
  authorId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column({ nullable: true })
  parentId: string;

  @ManyToOne(() => TopicComment, (comment) => comment.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: TopicComment;

  @OneToMany(() => TopicComment, (comment) => comment.parent)
  replies: TopicComment[];

  @Column({ default: 0 })
  score: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
