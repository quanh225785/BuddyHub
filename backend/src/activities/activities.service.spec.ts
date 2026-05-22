import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

describe('ActivitiesService', () => {
  const activityCategory = {
    upsert: jest.fn(),
  };
  const activity = {
    create: jest.fn(),
  };
  const prisma = {
    activityCategory,
    activity,
  } as unknown as PrismaService;

  let service: ActivitiesService;

  const validDto: CreateActivityDto = {
    type: 'Ăn uống / Cà phê',
    name: 'Ăn trưa tại Canteen Bách Khoa',
    location: 'Tòa nhà Hội Sinh viên, tầng 2',
    startTime: '2026-05-24T11:30:00.000Z',
    maxPeople: 6,
    purpose: 'Gặp gỡ bạn mới',
    deadline: '2026-05-23T11:30:00.000Z',
    chatLink: 'https://t.me/buddyhub_group',
    description: 'Mô tả thêm về hoạt động',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    activityCategory.upsert.mockResolvedValue({ id: 'category-id' });
    activity.create.mockResolvedValue({ id: 'activity-id' });
    service = new ActivitiesService(prisma);
  });

  it('creates an activity and returns OK', async () => {
    await expect(service.create('host-id', validDto)).resolves.toEqual({
      message: 'OK',
    });

    expect(activityCategory.upsert).toHaveBeenCalledWith({
      where: { name: 'Ăn uống' },
      update: {},
      create: { name: 'Ăn uống' },
    });
    expect(activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        hostId: 'host-id',
        categoryId: 'category-id',
        title: 'Ăn trưa tại Canteen Bách Khoa',
        location: 'Tòa nhà Hội Sinh viên, tầng 2',
        maxSlots: 6,
        purpose: 'Gặp gỡ bạn mới',
        chatLink: 'https://t.me/buddyhub_group',
        description: 'Mô tả thêm về hoạt động',
      }),
    });
  });

  it('accepts activity date and start time fields from the UI form', async () => {
    await expect(
      service.create('host-id', {
        ...validDto,
        startTime: undefined,
        date: '2026-05-24',
        start: '11:30',
        end: '13:00',
      }),
    ).resolves.toEqual({ message: 'OK' });

    expect(activity.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        startTime: new Date(2026, 4, 24, 11, 30),
        endTime: new Date(2026, 4, 24, 13, 0),
      }),
    });
  });

  it('rejects invalid date and time field combinations', async () => {
    await expect(
      service.create('host-id', {
        ...validDto,
        startTime: undefined,
        date: '2026-02-30',
        start: '11:30',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects end times before the activity start time', async () => {
    await expect(
      service.create('host-id', {
        ...validDto,
        endTime: '2026-05-24T10:30:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported activity categories', async () => {
    await expect(
      service.create('host-id', { ...validDto, type: 'Du lịch' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects registration deadlines after the activity start time', async () => {
    await expect(
      service.create('host-id', {
        ...validDto,
        deadline: '2026-05-25T11:30:00.000Z',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported chat links', async () => {
    await expect(
      service.create('host-id', {
        ...validDto,
        chatLink: 'https://example.com/group',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts Messenger chat links', async () => {
    await expect(
      service.create('host-id', {
        ...validDto,
        chatLink: 'https://m.me/buddyhub',
      }),
    ).resolves.toEqual({ message: 'OK' });
  });

  it('rejects descriptions longer than 500 characters', async () => {
    await expect(
      service.create('host-id', {
        ...validDto,
        description: 'a'.repeat(501),
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
