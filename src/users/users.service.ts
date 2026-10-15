import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource, Repository } from 'typeorm';
import { removeFilesByUrl } from '../attachments/attachment-file.util';
import { AttachmentsService } from '../attachments/attachments.service';
import { paginate } from '../common/pagination/paginate.util';
import { selectColumns } from '../common/query/select-columns.util';
import { Paginated } from '../common/pagination/pagination.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User } from './user.entity';
import { UserProfile } from './users.interface';
import { toUserProfile } from './users.mapper';
import {
  AUTH_USER_SELECT,
  PUBLIC_USER_SELECT,
  USER_CREDENTIALS_SELECT,
} from './users.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly attachmentsService: AttachmentsService,
    private readonly i18n: I18nService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      select: USER_CREDENTIALS_SELECT,
    });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: AUTH_USER_SELECT,
    });
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.usersRepository.exists({
      where: { email: email.toLowerCase() },
    });
  }

  create(data: CreateUserDto): Promise<User> {
    const user = this.usersRepository.create({
      ...data,
      email: data.email.toLowerCase(),
    });
    return this.usersRepository.save(user);
  }

  async findAll(query: ListUsersQueryDto): Promise<Paginated<User>> {
    const qb = this.usersRepository
      .createQueryBuilder('user')
      .select(selectColumns('user', PUBLIC_USER_SELECT));

    if (query.keyword) {
      qb.andWhere(
        '(user.email ILIKE :keyword OR user.fullName ILIKE :keyword)',
        {
          keyword: `%${query.keyword}%`,
        },
      );
    }
    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    return paginate(qb.orderBy('user.id', 'ASC'), query);
  }

  async findByIdOrThrow(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: PUBLIC_USER_SELECT,
    });
    if (!user) {
      throw new NotFoundException(this.i18n.t('users.not_found'));
    }
    return user;
  }

  async updateRoleStatus(id: number, dto: UpdateUserRoleDto): Promise<User> {
    const result = await this.usersRepository.update(id, dto);
    if (!result.affected) {
      throw new NotFoundException(this.i18n.t('users.not_found'));
    }
    return this.findByIdOrThrow(id);
  }

  async getProfile(id: number): Promise<UserProfile> {
    const [user, avatar] = await Promise.all([
      this.findByIdOrThrow(id),
      this.attachmentsService.findAvatarUrl(id),
    ]);
    return toUserProfile(user, avatar);
  }

  async updateProfile(
    id: number,
    dto: UpdateProfileDto,
    avatar?: Express.Multer.File,
  ): Promise<UserProfile> {
    const replacedUrls = await this.dataSource.transaction(async (manager) => {
      if (Object.keys(dto).length) {
        await manager.update(User, id, dto);
      }
      if (!avatar) return [];
      const replacement = await this.attachmentsService.replaceAvatar(
        manager,
        id,
        avatar,
      );
      return replacement.replacedUrls;
    });
    await removeFilesByUrl(replacedUrls);
    return this.getProfile(id);
  }

  async deleteById(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(this.i18n.t('users.not_found'));
    }
  }
}
