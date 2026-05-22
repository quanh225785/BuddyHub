import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ActivityStatus, ParticipantStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { GetActivitiesQueryDto } from './dto/get-activities-query.dto';

const DESCRIPTION_MAX_LENGTH = 500;
const MAX_KEYWORD_LENGTH = 100;
const EARTH_RADIUS_KM = 6371;

const CATEGORY_ALIASES = new Map<string, string>([
  ['ăn uống', 'Ăn uống'],
  ['ăn uống / cà phê', 'Ăn uống'],
  ['ăn uống/cà phê', 'Ăn uống'],
  ['lunch', 'Ăn uống'],
  ['food', 'Ăn uống'],
  ['học nhóm', 'Học nhóm'],
  ['study', 'Học nhóm'],
  ['board games', 'Board Games'],
  ['board game', 'Board Games'],
  ['boardgame', 'Board Games'],
  ['thể thao', 'Thể thao'],
  ['thể thao / fitness', 'Thể thao'],
  ['thể thao/fitness', 'Thể thao'],
  ['sports', 'Thể thao'],
  ['sport', 'Thể thao'],
  ['giao lưu', 'Giao lưu'],
  ['giao lưu / tụ tập', 'Giao lưu'],
  ['giao lưu/tụ tập', 'Giao lưu'],
  ['giao lưu・tự học', 'Giao lưu'],
  ['giao lưu / tự học', 'Giao lưu'],
  ['giao lưu/tự học', 'Giao lưu'],
  ['social', 'Giao lưu'],
  ['khác', 'Khác'],
  ['other', 'Khác'],
]);

const ALL_CATEGORY_VALUES = new Set(['all', 'tất cả']);
const ALL_TIME_VALUES = new Set(['all', 'all_time', 'tất cả thời gian']);
const VALID_TIME_FILTERS = new Set(['today', 'tomorrow', 'this_week']);

interface ValidatedActivityInput {
  categoryName: string;
  title: string;
  location: string;
  startTime: Date;
  endTime?: Date;
  maxSlots: number;
  purpose: string;
  deadline: Date;
  chatLink: string;
  description?: string;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

type ActivityListItem = Prisma.ActivityGetPayload<{
  include: {
    category: true;
    host: {
      select: {
        id: true;
        name: true;
        avatarUrl: true;
      };
    };
    _count: {
      select: {
        participants: true;
      };
    };
  };
}>;

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: GetActivitiesQueryDto) {
    try {
      const keyword = this.getKeyword(query);
      const categoryName = this.getFilterCategoryName(query);
      const timeRange = this.getTimeRange(query);
      const userLocation = this.getUserLocation(query);

      const where: Prisma.ActivityWhereInput = {
        status: { notIn: [ActivityStatus.CANCELLED, ActivityStatus.FINISHED] },
      };

      if (keyword) {
        where.OR = [
          { title: { contains: keyword, mode: 'insensitive' } },
          { location: { contains: keyword, mode: 'insensitive' } },
          { purpose: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
        ];
      }

      if (categoryName) {
        where.category = { name: categoryName };
      }

      if (timeRange) {
        where.startTime = {
          gte: timeRange.from,
          lt: timeRange.to,
        };
      }

      const activities = await this.prisma.activity.findMany({
        where,
        include: {
          category: true,
          host: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              participants: { where: { status: ParticipantStatus.JOINED } },
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });

      return this.mapActivities(activities, userLocation);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('error');
    }
  }

  async create(hostId: string, dto: CreateActivityDto) {
    try {
      const input = this.validateCreateActivity(dto);
      const category = await this.prisma.activityCategory.upsert({
        where: { name: input.categoryName },
        update: {},
        create: { name: input.categoryName },
      });

      await this.prisma.activity.create({
        data: {
          hostId,
          categoryId: category.id,
          title: input.title,
          location: input.location,
          startTime: input.startTime,
          endTime: input.endTime,
          maxSlots: input.maxSlots,
          purpose: input.purpose,
          deadline: input.deadline,
          chatLink: input.chatLink,
          description: input.description,
        },
      });

      return { message: 'OK' };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('error');
    }
  }

  private mapActivities(
    activities: ActivityListItem[],
    userLocation?: UserLocation,
  ) {
    const mappedActivities = activities.map((activity) => {
      const distanceKm =
        userLocation &&
        activity.latitude !== null &&
        activity.longitude !== null
          ? this.calculateDistanceKm(
              userLocation.latitude,
              userLocation.longitude,
              activity.latitude,
              activity.longitude,
            )
          : null;

      return {
        id: activity.id,
        title: activity.title,
        category: {
          id: activity.category.id,
          name: activity.category.name,
        },
        categoryName: activity.category.name,
        purpose: activity.purpose,
        location: activity.location,
        latitude: activity.latitude,
        longitude: activity.longitude,
        startTime: activity.startTime,
        deadline: activity.deadline,
        maxSlots: activity.maxSlots,
        currentParticipants: activity._count.participants,
        description: activity.description,
        status: activity.status,
        host: activity.host,
        distanceKm,
      };
    });

    if (!userLocation) {
      return mappedActivities;
    }

    return mappedActivities.sort((first, second) => {
      if (first.distanceKm === null && second.distanceKm === null) return 0;
      if (first.distanceKm === null) return 1;
      if (second.distanceKm === null) return -1;
      return first.distanceKm - second.distanceKm;
    });
  }

  private validateCreateActivity(
    dto: CreateActivityDto,
  ): ValidatedActivityInput {
    const categoryName = this.getCreateCategoryName(dto);
    const title = this.getRequiredString(dto, [
      'title',
      'name',
      'activityName',
    ]);
    const location = this.getRequiredString(dto, ['location']);
    const startTime = this.getActivityStartTime(dto);
    const endTime = this.getOptionalActivityEndTime(dto);
    const maxSlots = this.getPositiveInteger(dto, [
      'maxSlots',
      'maxPeople',
      'maxParticipants',
      'capacity',
    ]);
    const purpose = this.getRequiredString(dto, ['purpose']);
    const deadline = this.getDate(dto, ['deadline', 'registrationDeadline']);
    const chatLink = this.getRequiredString(dto, [
      'chatLink',
      'contactLink',
      'groupChatLink',
    ]);
    const description = this.getOptionalString(dto, ['description']);

    if (deadline >= startTime) {
      throw this.error();
    }

    if (endTime && endTime <= startTime) {
      throw this.error();
    }

    if (!this.isChatLink(chatLink)) {
      throw this.error();
    }

    if (description && description.length > DESCRIPTION_MAX_LENGTH) {
      throw this.error();
    }

    return {
      categoryName,
      title,
      location,
      startTime,
      endTime,
      maxSlots,
      purpose,
      deadline,
      chatLink,
      description,
    };
  }

  private getKeyword(query: GetActivitiesQueryDto) {
    const keyword = this.getOptionalString(query, ['keyword']);
    if (!keyword) return undefined;

    if (keyword.length > MAX_KEYWORD_LENGTH) {
      throw this.error();
    }

    return keyword;
  }

  private getFilterCategoryName(query: GetActivitiesQueryDto) {
    const rawCategory = this.getOptionalString(query, [
      'category',
      'type',
      'activityType',
    ]);
    if (!rawCategory) return undefined;

    const normalized = this.normalize(rawCategory);
    if (ALL_CATEGORY_VALUES.has(normalized)) return undefined;

    return this.getAllowedCategoryName(normalized);
  }

  private getCreateCategoryName(dto: CreateActivityDto) {
    const rawCategory = this.getRequiredString(dto, [
      'type',
      'category',
      'categoryName',
      'activityType',
    ]);

    return this.getAllowedCategoryName(this.normalize(rawCategory));
  }

  private getAllowedCategoryName(normalizedCategory: string) {
    const categoryName = CATEGORY_ALIASES.get(normalizedCategory);
    if (!categoryName) {
      throw this.error();
    }

    return categoryName;
  }

  private getTimeRange(query: GetActivitiesQueryDto) {
    const rawTime = this.getOptionalString(query, ['time', 'activityTime']);
    if (!rawTime) return undefined;

    const normalized = this.normalize(rawTime);
    if (ALL_TIME_VALUES.has(normalized)) return undefined;
    if (!VALID_TIME_FILTERS.has(normalized)) {
      throw this.error();
    }

    const today = this.startOfDay(new Date());
    if (normalized === 'today') {
      return { from: today, to: this.addDays(today, 1) };
    }

    if (normalized === 'tomorrow') {
      const tomorrow = this.addDays(today, 1);
      return { from: tomorrow, to: this.addDays(tomorrow, 1) };
    }

    return { from: today, to: this.startOfNextWeek(today) };
  }

  private getUserLocation(query: GetActivitiesQueryDto) {
    const latitudeValue = this.findFirstValue(query, [
      'latitude',
      'lat',
      'currentLatitude',
      'currentLat',
    ]);
    const longitudeValue = this.findFirstValue(query, [
      'longitude',
      'lng',
      'currentLongitude',
      'currentLng',
    ]);

    if (latitudeValue === undefined && longitudeValue === undefined) {
      return undefined;
    }

    if (latitudeValue === undefined || longitudeValue === undefined) {
      throw this.error();
    }

    const latitude = this.parseNumber(latitudeValue);
    const longitude = this.parseNumber(longitudeValue);

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw this.error();
    }

    return { latitude, longitude };
  }

  private getActivityStartTime(dto: CreateActivityDto) {
    const directValue = this.findFirstValue(dto, ['startTime', 'startAt', 'time']);
    if (directValue !== undefined) {
      return this.parseDate(directValue);
    }

    const activityDate = this.getRequiredString(dto, ['date', 'activityDate']);
    const start = this.getRequiredString(dto, ['start', 'startHour']);

    return this.parseDateAndTime(activityDate, start);
  }

  private getOptionalActivityEndTime(dto: CreateActivityDto) {
    const directValue = this.findFirstValue(dto, ['endTime', 'endAt']);
    if (directValue !== undefined) {
      return this.parseDate(directValue);
    }

    const end = this.findFirstValue(dto, ['end', 'endHour']);
    if (end === undefined) {
      return undefined;
    }

    const activityDate = this.getRequiredString(dto, ['date', 'activityDate']);
    if (typeof end !== 'string' || !end.trim()) {
      throw this.error();
    }

    return this.parseDateAndTime(activityDate, end.trim());
  }

  private getDate<T extends object>(dto: T, keys: Array<keyof T>) {
    return this.parseDate(this.getFirstValue(dto, keys));
  }

  private parseDate(value: unknown) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value !== 'string' || !value.trim()) {
      throw this.error();
    }

    const parsed = new Date(value.trim());
    if (Number.isNaN(parsed.getTime())) {
      throw this.error();
    }

    return parsed;
  }

  private parseDateAndTime(dateValue: string, timeValue: string) {
    const dateMatch = dateValue
      .trim()
      .match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const timeMatch = timeValue
      .trim()
      .match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

    if (!dateMatch || !timeMatch) {
      throw this.error();
    }

    const [, year, month, day] = dateMatch;
    const [, hour, minute, second = '0'] = timeMatch;
    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );

    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day) ||
      date.getHours() !== Number(hour) ||
      date.getMinutes() !== Number(minute) ||
      date.getSeconds() !== Number(second)
    ) {
      throw this.error();
    }

    return date;
  }

  private getPositiveInteger<T extends object>(
    dto: T,
    keys: Array<keyof T>,
  ) {
    const value = this.getFirstValue(dto, keys);
    const numericValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value.trim())
          : Number.NaN;

    if (!Number.isInteger(numericValue) || numericValue <= 0) {
      throw this.error();
    }

    return numericValue;
  }

  private getRequiredString<T extends object>(dto: T, keys: Array<keyof T>) {
    const value = this.getFirstValue(dto, keys);
    if (typeof value !== 'string' || !value.trim()) {
      throw this.error();
    }

    return value.trim();
  }

  private getOptionalString<T extends object>(dto: T, keys: Array<keyof T>) {
    const value = this.findFirstValue(dto, keys);
    if (value === undefined) return undefined;

    if (typeof value !== 'string') {
      throw this.error();
    }

    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : undefined;
  }

  private getFirstValue<T extends object>(dto: T, keys: Array<keyof T>) {
    const value = this.findFirstValue(dto, keys);
    if (value !== undefined) {
      return value;
    }

    throw this.error();
  }

  private findFirstValue<T extends object>(dto: T, keys: Array<keyof T>) {
    for (const key of keys) {
      const value = dto[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    return undefined;
  }

  private parseNumber(value: unknown) {
    const numberValue =
      typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? Number(value.trim())
          : Number.NaN;

    if (!Number.isFinite(numberValue)) {
      throw this.error();
    }

    return numberValue;
  }

  private calculateDistanceKm(
    fromLatitude: number,
    fromLongitude: number,
    toLatitude: number,
    toLongitude: number,
  ) {
    const latitudeDelta = this.toRadians(toLatitude - fromLatitude);
    const longitudeDelta = this.toRadians(toLongitude - fromLongitude);
    const firstLatitude = this.toRadians(fromLatitude);
    const secondLatitude = this.toRadians(toLatitude);

    const haversine =
      Math.sin(latitudeDelta / 2) ** 2 +
      Math.cos(firstLatitude) *
        Math.cos(secondLatitude) *
        Math.sin(longitudeDelta / 2) ** 2;

    const distance =
      2 *
      EARTH_RADIUS_KM *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

    return Math.round(distance * 100) / 100;
  }

  private toRadians(degrees: number) {
    return (degrees * Math.PI) / 180;
  }

  private startOfDay(value: Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  private addDays(value: Date, days: number) {
    const nextDate = new Date(value);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private startOfNextWeek(today: Date) {
    const daysUntilNextMonday = 8 - (today.getDay() || 7);
    return this.addDays(today, daysUntilNextMonday);
  }

  private isChatLink(value: string) {
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) return false;

      const hostname = url.hostname.toLowerCase();
      const pathname = url.pathname.toLowerCase();

      return (
        hostname === 't.me' ||
        hostname.endsWith('.t.me') ||
        hostname === 'telegram.me' ||
        hostname.endsWith('.telegram.me') ||
        hostname === 'zalo.me' ||
        hostname.endsWith('.zalo.me') ||
        hostname === 'm.me' ||
        hostname.endsWith('.m.me') ||
        hostname === 'messenger.com' ||
        hostname.endsWith('.messenger.com') ||
        ((hostname === 'facebook.com' || hostname.endsWith('.facebook.com')) &&
          pathname.startsWith('/messages'))
      );
    } catch {
      return false;
    }
  }

  private normalize(value: string) {
    return value.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
  }

  private error() {
    return new BadRequestException('error');
  }
}
