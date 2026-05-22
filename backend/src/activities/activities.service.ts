import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';

const DESCRIPTION_MAX_LENGTH = 500;

const CATEGORY_ALIASES = new Map<string, string>([
  ['ăn uống', 'Ăn uống'],
  ['ăn uống / cà phê', 'Ăn uống'],
  ['ăn uống/cà phê', 'Ăn uống'],
  ['học nhóm', 'Học nhóm'],
  ['board games', 'Board Games'],
  ['thể thao', 'Thể thao'],
  ['thể thao / fitness', 'Thể thao'],
  ['thể thao/fitness', 'Thể thao'],
  ['giao lưu', 'Giao lưu'],
  ['giao lưu / tụ tập', 'Giao lưu'],
  ['giao lưu/tụ tập', 'Giao lưu'],
  ['giao lưu・tự học', 'Giao lưu'],
  ['giao lưu / tự học', 'Giao lưu'],
  ['giao lưu/tự học', 'Giao lưu'],
  ['khác', 'Khác'],
]);

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

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

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

  private validateCreateActivity(
    dto: CreateActivityDto,
  ): ValidatedActivityInput {
    const categoryName = this.getCategoryName(dto);
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
    const description = this.getOptionalString(dto, 'description');

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

  private getCategoryName(dto: CreateActivityDto) {
    const rawCategory = this.getRequiredString(dto, [
      'type',
      'category',
      'categoryName',
      'activityType',
    ]);
    const normalized = this.normalize(rawCategory);
    const categoryName = CATEGORY_ALIASES.get(normalized);

    if (!categoryName) {
      throw this.error();
    }

    return categoryName;
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

  private getDate(dto: CreateActivityDto, keys: Array<keyof CreateActivityDto>) {
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

  private getPositiveInteger(
    dto: CreateActivityDto,
    keys: Array<keyof CreateActivityDto>,
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

  private getRequiredString(
    dto: CreateActivityDto,
    keys: Array<keyof CreateActivityDto>,
  ) {
    const value = this.getFirstValue(dto, keys);
    if (typeof value !== 'string' || !value.trim()) {
      throw this.error();
    }

    return value.trim();
  }

  private getOptionalString(dto: CreateActivityDto, key: keyof CreateActivityDto) {
    const value = dto[key];
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    if (typeof value !== 'string') {
      throw this.error();
    }

    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : undefined;
  }

  private getFirstValue(
    dto: CreateActivityDto,
    keys: Array<keyof CreateActivityDto>,
  ) {
    const value = this.findFirstValue(dto, keys);
    if (value !== undefined) {
      return value;
    }

    throw this.error();
  }

  private findFirstValue(
    dto: CreateActivityDto,
    keys: Array<keyof CreateActivityDto>,
  ) {
    for (const key of keys) {
      const value = dto[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }

    return undefined;
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
