import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AttachableType {
  USER_AVATAR = 'user_avatar',
  TOUR_IMAGE = 'tour_image',
}

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'attachable_type', type: 'enum', enum: AttachableType })
  attachableType: AttachableType;

  @Column({ name: 'attachable_id' })
  attachableId: number;

  @Column()
  url: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_type' })
  fileType: string;

  @Column({ name: 'file_size' })
  fileSize: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
