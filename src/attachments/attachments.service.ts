import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { EntityManager, Repository } from 'typeorm';
import { AttachableType } from './attachable-type.enum';
import { removeFilesByUrl, toAttachmentData } from './attachment-file.util';
import { Attachment } from './attachment.entity';
import {
  ATTACHMENT_FILE_SELECT,
  ATTACHMENT_SELECT,
} from './attachments.constants';
import { AvatarReplacement } from './attachments.interface';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: Repository<Attachment>,
    private readonly i18n: I18nService,
  ) {}

  async findAvatarUrl(userId: number): Promise<string | null> {
    const avatar = await this.attachmentsRepository.findOne({
      where: {
        attachableType: AttachableType.USER_AVATAR,
        attachableId: userId,
      },
      select: ATTACHMENT_FILE_SELECT,
    });
    return avatar?.url ?? null;
  }

  findTourImages(tourId: number): Promise<Attachment[]> {
    return this.attachmentsRepository.find({
      where: {
        attachableType: AttachableType.TOUR_IMAGE,
        attachableId: tourId,
      },
      select: ATTACHMENT_SELECT,
      order: { createdAt: 'ASC' },
    });
  }

  async replaceAvatar(
    manager: EntityManager,
    userId: number,
    file: Express.Multer.File,
  ): Promise<AvatarReplacement> {
    const where = {
      attachableType: AttachableType.USER_AVATAR,
      attachableId: userId,
    };
    const previous = await manager.find(Attachment, {
      where,
      select: ATTACHMENT_FILE_SELECT,
    });
    if (previous.length) {
      await manager.delete(Attachment, where);
    }
    const data = toAttachmentData(file, AttachableType.USER_AVATAR, userId);
    await manager.insert(Attachment, data);
    return { url: data.url, replacedUrls: previous.map((item) => item.url) };
  }

  async addTourImages(
    manager: EntityManager,
    tourId: number,
    files: Express.Multer.File[],
  ): Promise<void> {
    if (!files.length) return;
    await manager.insert(
      Attachment,
      files.map((file) =>
        toAttachmentData(file, AttachableType.TOUR_IMAGE, tourId),
      ),
    );
  }

  async removeTourImage(tourId: number, imageId: string): Promise<void> {
    const image = await this.attachmentsRepository.findOne({
      where: {
        id: imageId,
        attachableType: AttachableType.TOUR_IMAGE,
        attachableId: tourId,
      },
      select: ATTACHMENT_FILE_SELECT,
    });
    if (!image) {
      throw new NotFoundException(this.i18n.t('attachments.image_not_found'));
    }
    await this.attachmentsRepository.delete(image.id);
    await removeFilesByUrl([image.url]);
  }
}
