import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Repository } from 'typeorm';
import { Paginated } from '../common/pagination.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { User } from './user.entity';
import { PUBLIC_USER_SELECT } from './users.constants';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly i18n: I18nService,
  ) {}

  findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password: true,
        fullName: true,
        role: true,
        status: true,
      },
    });
  }

  findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
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
      .select(Object.keys(PUBLIC_USER_SELECT).map((field) => `user.${field}`));

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

    const [data, total] = await qb
      .orderBy('user.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return { data, meta: { page: query.page, limit: query.limit, total } };
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

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<User> {
    const result = await this.usersRepository.update(id, dto);
    if (!result.affected) {
      throw new NotFoundException(this.i18n.t('users.not_found'));
    }
    return this.findByIdOrThrow(id);
  }

  async deleteById(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(this.i18n.t('users.not_found'));
    }
  }
}
