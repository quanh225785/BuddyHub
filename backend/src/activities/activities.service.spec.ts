import { BadRequestException } from '@nestjs/common';
import { ParticipantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

describe('ActivitiesService', () => {
  const activityCategory = {
    upsert: jest.fn(),
  };
  const activity = {
    create: jest.fn(),
    findMany: jest.fn(),
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

  const firstActivity = {
    id: 'activity-1',
    title: 'Lunch at the Union Cafeteria',
    purpose: 'Gặp gỡ bạn mới',
    location: 'Student Union Building, 2nd Floor',
    latitude: 21.005,
    longitude: 105.845,
    startTime: new Date('2026-05-24T12:00:00.000Z'),
    deadline: new Date('2026-05-23T12:00:00.000Z'),
    maxSlots: 6,
    description: 'Grabbing lunch and chatting about anything.',
    status: 'OPEN',
    category: { id: 'category-1', name: 'Ăn uống' },
    host: { id: 'user-1', name: 'Alex Chen', avatarUrl: null },
    _count: { participants: 3 },
  };

  const secondActivity = {
    ...firstActivity,
    id: 'activity-2',
    title: 'CS 301 Study Group',
    latitude: 21.001,
    longitude: 105.841,
    category: { id: 'category-2', name: 'Học nhóm' },
    _count: { participants: 5 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    activityCategory.upsert.mockResolvedValue({ id: 'category-id' });
    activity.create.mockResolvedValue({ id: 'activity-id' });
    activity.findMany.mockResolvedValue([firstActivity, secondActivity]);
    service = new ActivitiesService(prisma);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns activity list items', async () => {
    await expect(service.findAll({})).resolves.toEqual([
      expect.objectContaining({
        id: 'activity-1',
        title: 'Lunch at the Union Cafeteria',
        categoryName: 'Ăn uống',
        currentParticipants: 3,
        maxSlots: 6,
        host: { id: 'user-1', name: 'Alex Chen', avatarUrl: null },
        distanceKm: null,
      }),
      expect.objectContaining({
        id: 'activity-2',
        categoryName: 'Học nhóm',
        currentParticipants: 5,
      }),
    ]);

    expect(activity.findMany).toHaveBeenCalledWith({
      where: {
        status: { notIn: ['CANCELLED', 'FINISHED'] },
      },
      include: expect.objectContaining({
        _count: {
          select: {
            participants: { where: { status: ParticipantStatus.JOINED } },
          },
        },
      }),
      orderBy: { startTime: 'asc' },
    });
  });

  it('filters by keyword and category aliases', async () => {
    await service.findAll({ keyword: 'cafeteria', category: 'Lunch' });

    expect(activity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: { name: 'Ăn uống' },
          OR: [
            { title: { contains: 'cafeteria', mode: 'insensitive' } },
            { location: { contains: 'cafeteria', mode: 'insensitive' } },
            { purpose: { contains: 'cafeteria', mode: 'insensitive' } },
            { description: { contains: 'cafeteria', mode: 'insensitive' } },
          ],
        }),
      }),
    );
  });

  it('sorts nearby activities first when user location is provided', async () => {
    const result = await service.findAll({
      latitude: '21.001',
      longitude: '105.841',
    });

    expect(result[0]).toEqual(
      expect.objectContaining({
        id: 'activity-2',
        distanceKm: 0,
      }),
    );
  });

  it('adds today time range', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-22T04:00:00.000Z'));

    await service.findAll({ time: 'today' });

    const call = activity.findMany.mock.calls[0][0];
    expect(call.where.startTime.gte).toBeInstanceOf(Date);
    expect(call.where.startTime.lt).toBeInstanceOf(Date);
    expect(call.where.startTime.gte.getTime()).toBeLessThan(
      call.where.startTime.lt.getTime(),
    );
  });

  it('rejects keywords longer than 100 characters', async () => {
    await expect(
      service.findAll({ keyword: 'a'.repeat(101) }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects unsupported categories', async () => {
    await expect(service.findAll({ category: 'Travel' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects unsupported time filters', async () => {
    await expect(service.findAll({ time: 'next_month' })).rejects.toThrow(
      BadRequestException,
    );
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
