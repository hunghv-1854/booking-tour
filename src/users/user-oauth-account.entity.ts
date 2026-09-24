import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
}

@Entity('user_oauth_accounts')
@Index(['provider', 'providerUserId'], { unique: true })
export class UserOAuthAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: OAuthProvider })
  provider: OAuthProvider;

  @Column({ name: 'provider_user_id' })
  providerUserId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
