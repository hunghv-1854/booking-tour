import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from './attachment.entity';
import { AttachmentsService } from './attachments.service';
import { UploadCleanupTask } from './upload-cleanup.task';

@Module({
  imports: [TypeOrmModule.forFeature([Attachment])],
  providers: [AttachmentsService, UploadCleanupTask],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
