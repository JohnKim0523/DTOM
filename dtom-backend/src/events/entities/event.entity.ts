import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum EventStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  purpose: string;

  @Column({ type: 'datetime', nullable: true })
  eventDate: Date;

  @Column({ nullable: true })
  location: string;

  @Column({ type: 'enum', enum: EventStatus, default: EventStatus.PUBLISHED })
  status: EventStatus;

  @Column({ default: false })
  hasFundraising: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fundraisingGoal: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  fundraisingCurrent: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  maxAttendees: number;

  @Column()
  organizerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'organizerId' })
  organizer: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
