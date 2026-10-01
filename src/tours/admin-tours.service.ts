import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { DataSource, EntityManager, Not, Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { paginate } from '../common/pagination/paginate.util';
import { Paginated } from '../common/pagination/pagination.interface';
import { selectColumns } from '../common/query/select-columns.util';
import { fieldError } from '../common/validation/field-error.util';
import { CreateTourDto } from './dto/create-tour.dto';
import { ToursFilterQueryDto } from './dto/tours-filter-query.dto';
import { TourItineraryDto } from './dto/tour-itinerary.dto';
import { UpdateTourDto } from './dto/update-tour.dto';
import { TourItinerary } from './tour-itinerary.entity';
import { Tour } from './tour.entity';
import {
  ADMIN_TOUR_SELECT,
  TOUR_DETAIL_SELECT,
  TOUR_UPDATE_CHECK_SELECT,
} from './tours.constants';
import { applyToursFilter } from './tours-query.util';
import { assertDateRange, assertItineraryDays } from './tours-validation.util';

@Injectable()
export class AdminToursService {
  constructor(
    @InjectRepository(Tour)
    private readonly toursRepository: Repository<Tour>,
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly i18n: I18nService,
  ) {}

  findAll(query: ToursFilterQueryDto): Promise<Paginated<Tour>> {
    const qb = applyToursFilter(
      this.toursRepository
        .createQueryBuilder('tour')
        .select(selectColumns('tour', ADMIN_TOUR_SELECT)),
      query,
    );
    return paginate(qb.orderBy('tour.id', 'ASC'), query);
  }

  async findByIdOrThrow(id: number): Promise<Tour> {
    const tour = await this.toursRepository.findOne({
      where: { id },
      relations: { category: true, itineraries: true },
      select: TOUR_DETAIL_SELECT,
      order: { itineraries: { dayNumber: 'ASC' } },
    });
    if (!tour) {
      throw new NotFoundException(this.i18n.t('tours.not_found'));
    }
    return tour;
  }

  async create(dto: CreateTourDto): Promise<Tour> {
    const { itineraries = [], ...tourData } = dto;
    assertDateRange(this.i18n, dto.startDate, dto.endDate);
    assertItineraryDays(
      this.i18n,
      itineraries.map((item) => item.dayNumber),
      dto.duration,
    );
    await Promise.all([
      this.assertCategoryExists(dto.categoryId),
      this.assertSlugIsFree(dto.slug),
    ]);

    const id = await this.dataSource.transaction(async (manager) => {
      const tour = await manager.save(
        manager.create(Tour, { ...tourData, availableSlot: dto.maxSlot }),
      );
      await this.insertItineraries(manager, tour.id, itineraries);
      return tour.id;
    });
    return this.findByIdOrThrow(id);
  }

  async update(id: number, dto: UpdateTourDto): Promise<Tour> {
    const current = await this.toursRepository.findOne({
      where: { id },
      select: TOUR_UPDATE_CHECK_SELECT,
    });
    if (!current) {
      throw new NotFoundException(this.i18n.t('tours.not_found'));
    }

    const { itineraries, maxSlot, ...tourData } = dto;
    assertDateRange(
      this.i18n,
      dto.startDate ?? current.startDate,
      dto.endDate ?? current.endDate,
    );
    if (itineraries) {
      assertItineraryDays(
        this.i18n,
        itineraries.map((item) => item.dayNumber),
        dto.duration ?? current.duration,
      );
    }
    await Promise.all([
      dto.categoryId !== undefined && dto.categoryId !== current.categoryId
        ? this.assertCategoryExists(dto.categoryId)
        : undefined,
      dto.slug !== undefined && dto.slug !== current.slug
        ? this.assertSlugIsFree(dto.slug, id)
        : undefined,
    ]);

    await this.dataSource.transaction(async (manager) => {
      if (Object.keys(tourData).length) {
        await manager.update(Tour, id, tourData);
      }
      if (maxSlot !== undefined && maxSlot !== current.maxSlot) {
        await this.resizeSlots(manager, current, maxSlot);
      }
      if (itineraries) {
        await manager.delete(TourItinerary, { tourId: id });
        await this.insertItineraries(manager, id, itineraries);
      }
    });
    return this.findByIdOrThrow(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.toursRepository.softDelete(id);
    if (!result.affected) {
      throw new NotFoundException(this.i18n.t('tours.not_found'));
    }
  }

  private async resizeSlots(
    manager: EntityManager,
    current: Tour,
    maxSlot: number,
  ): Promise<void> {
    const delta = maxSlot - current.maxSlot;
    const result = await manager
      .createQueryBuilder()
      .update(Tour)
      .set({ maxSlot, availableSlot: () => 'available_slot + :delta' })
      .where('id = :id', { id: current.id })
      .andWhere('available_slot + :delta >= 0')
      .setParameters({ delta })
      .execute();

    if (!result.affected) {
      const booked = current.maxSlot - current.availableSlot;
      throw fieldError(
        'maxSlot',
        this.i18n.t('tours.max_slot_below_booked', { args: { booked } }),
      );
    }
  }

  private async insertItineraries(
    manager: EntityManager,
    tourId: number,
    itineraries: TourItineraryDto[],
  ): Promise<void> {
    if (!itineraries.length) return;
    await manager.insert(
      TourItinerary,
      itineraries.map((item) => ({ ...item, tourId })),
    );
  }

  private async assertCategoryExists(categoryId: number): Promise<void> {
    const exists = await this.categoriesRepository.exists({
      where: { id: categoryId },
    });
    if (!exists) {
      throw fieldError('categoryId', this.i18n.t('tours.category_not_found'));
    }
  }

  private async assertSlugIsFree(
    slug: string,
    excludeId?: number,
  ): Promise<void> {
    const slugTaken = await this.toursRepository.exists({
      where: excludeId ? { slug, id: Not(excludeId) } : { slug },
      withDeleted: true,
    });
    if (slugTaken) {
      throw fieldError('slug', this.i18n.t('tours.slug_taken'));
    }
  }
}
