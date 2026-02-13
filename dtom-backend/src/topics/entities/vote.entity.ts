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

export enum VoteTargetType {
  TOPIC = 'topic',
  TOPIC_COMMENT = 'topic_comment',
}

@Entity('votes')
@Unique(['userId', 'targetType', 'targetId'])
export class Vote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: VoteTargetType })
  targetType: VoteTargetType;

  @Column()
  targetId: string;

  @CreateDateColumn()
  createdAt: Date;
}
