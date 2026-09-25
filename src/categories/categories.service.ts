import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { Not, Repository } from 'typeorm';
import { Paginated } from '../common/pagination.interface';
import { isForeignKeyViolation } from '../common/postgres-error.util';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ListCategoriesQueryDto } from './dto/list-categories-query.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly i18n: I18nService,
  ) {}

  async findAll(query: ListCategoriesQueryDto): Promise<Paginated<Category>> {
    const qb = this.categoriesRepository.createQueryBuilder('category');

    if (query.keyword) {
      qb.andWhere('category.name ILIKE :keyword', {
        keyword: `%${query.keyword}%`,
      });
    }

    const [data, total] = await qb
      .orderBy('category.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit)
      .getManyAndCount();

    return { data, meta: { page: query.page, limit: query.limit, total } };
  }

  async findByIdOrThrow(id: number): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(this.i18n.t('categories.not_found'));
    }
    return category;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    await this.assertSlugIsFree(dto.slug);

    const category = this.categoriesRepository.create(dto);
    return this.categoriesRepository.save(category);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    if (dto.slug) {
      await this.assertSlugIsFree(dto.slug, id);
    }

    const result = await this.categoriesRepository.update(id, dto);
    if (!result.affected) {
      throw new NotFoundException(this.i18n.t('categories.not_found'));
    }
    return this.findByIdOrThrow(id);
  }

  async remove(id: number): Promise<void> {
    try {
      const result = await this.categoriesRepository.delete(id);
      if (!result.affected) {
        throw new NotFoundException(this.i18n.t('categories.not_found'));
      }
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new ConflictException(this.i18n.t('categories.in_use'));
      }
      throw error;
    }
  }

  private async assertSlugIsFree(
    slug: string,
    excludeId?: number,
  ): Promise<void> {
    const slugTaken = await this.categoriesRepository.exists({
      where: excludeId ? { slug, id: Not(excludeId) } : { slug },
    });
    if (slugTaken) {
      throw new UnprocessableEntityException({
        errors: { slug: [this.i18n.t('categories.slug_taken')] },
      });
    }
  }
}
