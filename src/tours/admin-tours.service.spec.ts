import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { I18nService } from 'nestjs-i18n';
import { AttachmentsService } from '../attachments/attachments.service';
import { Category } from '../categories/category.entity';
import { createI18nMock } from '../common/testing/i18n.mock';
import { createUpdateQueryBuilderMock } from '../common/testing/query-builder.mock';
import { AdminToursService } from './admin-tours.service';
import { CreateTourDto } from './dto/create-tour.dto';
import { TourItinerary } from './tour-itinerary.entity';
import { Tour } from './tour.entity';

describe('AdminToursService', () => {
  let service: AdminToursService;
  const toursRepository = { findOne: jest.fn(), exists: jest.fn() };
  const categoriesRepository = { exists: jest.fn() };
  const attachmentsService = {
    addTourImages: jest.fn(),
    findTourImages: jest.fn().mockResolvedValue([]),
  };
  const manager = {
    create: jest.fn((_entity: unknown, data: object) => data),
    save: jest.fn((data: object) => Promise.resolve({ id: 5, ...data })),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };
  const dto: CreateTourDto = {
    categoryId: 1,
    name: 'Tour Huế',
    slug: 'tour-hue',
    description: 'd',
    price: 1_000_000,
    duration: 2,
    location: 'Huế',
    startDate: '2026-11-01',
    endDate: '2026-11-10',
    maxSlot: 10,
    itineraries: [{ dayNumber: 1, title: 'Ngày 1' }],
  };
  const currentTour = {
    id: 5,
    categoryId: 1,
    slug: 'tour-hue',
    duration: 2,
    startDate: '2026-11-01',
    endDate: '2026-11-10',
    maxSlot: 10,
    availableSlot: 4,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminToursService,
        { provide: getRepositoryToken(Tour), useValue: toursRepository },
        {
          provide: getRepositoryToken(Category),
          useValue: categoriesRepository,
        },
        {
          provide: getDataSourceToken(),
          useValue: {
            transaction: (work: (m: typeof manager) => unknown) =>
              work(manager),
          },
        },
        { provide: AttachmentsService, useValue: attachmentsService },
        { provide: I18nService, useValue: createI18nMock() },
      ],
    }).compile();
    service = moduleRef.get(AdminToursService);
    categoriesRepository.exists.mockResolvedValue(true);
    toursRepository.exists.mockResolvedValue(false);
    toursRepository.findOne.mockResolvedValue({ ...currentTour });
  });

  describe('create', () => {
    it('creates the tour, itineraries and images in one transaction with availableSlot = maxSlot', async () => {
      const images = [{ filename: 'a.png' }] as Express.Multer.File[];

      await service.create(dto, images);

      expect(manager.create).toHaveBeenCalledWith(
        Tour,
        expect.objectContaining({ availableSlot: 10 }),
      );
      expect(manager.insert).toHaveBeenCalledWith(TourItinerary, [
        { dayNumber: 1, title: 'Ngày 1', tourId: 5 },
      ]);
      expect(attachmentsService.addTourImages).toHaveBeenCalledWith(
        manager,
        5,
        images,
      );
    });

    it('rejects an unknown category on the categoryId field', async () => {
      categoriesRepository.exists.mockResolvedValue(false);

      await expect(service.create(dto)).rejects.toMatchObject({
        response: { errors: { categoryId: ['tours.category_not_found'] } },
      });
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('checks the slug against soft-deleted tours too', async () => {
      toursRepository.exists.mockResolvedValue(true);

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
      expect(toursRepository.exists).toHaveBeenCalledWith({
        where: { slug: 'tour-hue' },
        withDeleted: true,
      });
    });
  });

  describe('update', () => {
    it('throws NotFound for an unknown tour', async () => {
      toursRepository.findOne.mockResolvedValue(null);

      await expect(service.update(99, { name: 'x' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('validates the new end date against the current start date', async () => {
      await expect(
        service.update(5, { endDate: '2026-10-31' }),
      ).rejects.toBeInstanceOf(UnprocessableEntityException);
      expect(manager.update).not.toHaveBeenCalled();
    });

    it('shifts availableSlot by the maxSlot delta', async () => {
      const qb = createUpdateQueryBuilderMock(1);
      manager.createQueryBuilder.mockReturnValue(qb);

      await service.update(5, { maxSlot: 15 });

      expect(qb.setParameters).toHaveBeenCalledWith({ delta: 5 });
    });

    it('rejects shrinking maxSlot below the booked slots', async () => {
      manager.createQueryBuilder.mockReturnValue(
        createUpdateQueryBuilderMock(0),
      );

      await expect(service.update(5, { maxSlot: 3 })).rejects.toMatchObject({
        response: { errors: { maxSlot: ['tours.max_slot_below_booked'] } },
      });
    });

    it('replaces the whole itinerary only when itineraries are sent', async () => {
      await service.update(5, { name: 'New name' });
      expect(manager.delete).not.toHaveBeenCalled();

      await service.update(5, {
        itineraries: [{ dayNumber: 2, title: 'Ngày 2' }],
      });
      expect(manager.delete).toHaveBeenCalledWith(TourItinerary, {
        tourId: 5,
      });
    });
  });
});
