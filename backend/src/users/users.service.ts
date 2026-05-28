import { BadRequestException, Injectable } from '@nestjs/common';
import { ActivityStatus, ParticipantStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcryptjs';

type UserDashboardActivity = {
  id: string;
  title: string;
  location: string;
  startTime: Date;
  maxSlots: number;
  currentParticipants: number;
  role: 'host' | 'joined';
  categoryName: string;
  imageUrl?: string | null;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        studentId: true,
        name: true,
        faculty: true,
        schoolYear: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        gender: true,
        interests: {
          select: {
            interest: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('error');
    }

    const [hostedCount, joinedCount] = await Promise.all([
      this.prisma.activity.count({ where: { hostId: userId } }),
      this.prisma.activityParticipant.count({
        where: { userId, status: 'JOINED' },
      }),
    ]);

    return {
      message: 'OK',
      profile: {
        studentId: user.studentId,
        name: user.name,
        faculty: user.faculty,
        schoolYear: user.schoolYear,
        interests: user.interests.map((item) => item.interest.name),
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        gender: user.gender,
        hostedCount,
        joinedCount,
        isVerified: user.isVerified,
      },
    };
  }

  async updateMyProfile(userId: string, dto: UpdateProfileDto) {
    const exists = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!exists) {
      throw new BadRequestException('error');
    }

    const updateData: {
      name?: string;
      faculty?: string | null;
      schoolYear?: number | null;
      avatarUrl?: string | null;
      bio?: string | null;
      interests?: {
        deleteMany: Record<string, never>;
        create: { interest: { connect: { name: string } } }[];
      };
    } = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.faculty !== undefined) updateData.faculty = dto.faculty;
    if (dto.schoolYear !== undefined) updateData.schoolYear = dto.schoolYear;
    if (dto.avatarUrl !== undefined) updateData.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) updateData.bio = dto.bio;

    if (dto.interests !== undefined) {
      const normalized = Array.from(
        new Set(
          dto.interests
            .map((value) => value.trim())
            .filter((value) => value.length > 0),
        ),
      );

      const existingTags = await this.prisma.interestTag.findMany({
        where: { name: { in: normalized } },
        select: { name: true },
      });

      if (existingTags.length !== normalized.length) {
        throw new BadRequestException('error');
      }

      updateData.interests = {
        deleteMany: {},
        create: normalized.map((name) => ({
          interest: {
            connect: { name },
          },
        })),
      };
    }

    if (Object.keys(updateData).length > 0) {
      await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });
    }

    return this.getPublicProfile(userId);
  }

  async changeMyPassword(userId: string, dto: ChangePasswordDto) {
    const currentPassword = dto.currentPassword?.trim()
    const newPassword = dto.newPassword?.trim()

    if (!currentPassword || !newPassword) {
      throw new BadRequestException('error')
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    })

    if (!user) {
      throw new BadRequestException('error')
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác')
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 8 ký tự')
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(newPassword, 10) },
    })

    return { message: 'OK' }
  }

  async getMyDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        studentId: true,
        faculty: true,
        schoolYear: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        gender: true,
        interests: {
          select: {
            interest: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('error');
    }

    const now = new Date();

    const [hostedUpcoming, joinedUpcoming, hostedHistory, joinedHistory, hostedCount, joinedCount] = await Promise.all([
      this.prisma.activity.findMany({
        where: {
          hostId: userId,
          status: { notIn: [ActivityStatus.CANCELLED, ActivityStatus.FINISHED] },
          startTime: { gte: now },
        },
        include: {
          category: { select: { name: true } },
          _count: { select: { participants: { where: { status: ParticipantStatus.JOINED } } } },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.activity.findMany({
        where: {
          hostId: { not: userId },
          status: { notIn: [ActivityStatus.CANCELLED, ActivityStatus.FINISHED] },
          startTime: { gte: now },
          participants: { some: { userId, status: ParticipantStatus.JOINED } },
        },
        include: {
          category: { select: { name: true } },
          _count: { select: { participants: { where: { status: ParticipantStatus.JOINED } } } },
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.activity.findMany({
        where: {
          hostId: userId,
          OR: [
            { status: { in: [ActivityStatus.CANCELLED, ActivityStatus.FINISHED] } },
            { startTime: { lt: now } },
          ],
        },
        include: {
          category: { select: { name: true } },
          _count: { select: { participants: { where: { status: ParticipantStatus.JOINED } } } },
        },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.activity.findMany({
        where: {
          hostId: { not: userId },
          participants: { some: { userId, status: ParticipantStatus.JOINED } },
          OR: [
            { status: { in: [ActivityStatus.CANCELLED, ActivityStatus.FINISHED] } },
            { startTime: { lt: now } },
          ],
        },
        include: {
          category: { select: { name: true } },
          _count: { select: { participants: { where: { status: ParticipantStatus.JOINED } } } },
        },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.activity.count({ where: { hostId: userId } }),
      this.prisma.activityParticipant.count({ where: { userId, status: ParticipantStatus.JOINED } }),
    ]);

    const mapActivity = (activity: {
      id: string;
      title: string;
      location: string;
      startTime: Date;
      maxSlots: number;
      imageUrl: string | null;
      category: { name: string };
      _count: { participants: number };
    }, role: 'host' | 'joined'): UserDashboardActivity => ({
      id: activity.id,
      title: activity.title,
      location: activity.location,
      startTime: activity.startTime,
      maxSlots: activity.maxSlots,
      currentParticipants: activity._count.participants,
      role,
      categoryName: activity.category.name,
      imageUrl: activity.imageUrl,
    });

    return {
      message: 'OK',
      profile: {
        id: user.id,
        email: user.email,
        studentId: user.studentId,
        name: user.name,
        faculty: user.faculty,
        schoolYear: user.schoolYear,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        interests: user.interests.map((item) => item.interest.name),
        gender: user.gender,
        hostedCount,
        joinedCount,
        isVerified: user.isVerified,
      },
      activities: {
        upcoming: [
          ...hostedUpcoming.map((activity) => mapActivity(activity, 'host')),
          ...joinedUpcoming.map((activity) => mapActivity(activity, 'joined')),
        ].sort((first, second) => first.startTime.getTime() - second.startTime.getTime()),
        history: [
          ...hostedHistory.map((activity) => mapActivity(activity, 'host')),
          ...joinedHistory.map((activity) => mapActivity(activity, 'joined')),
        ].sort((first, second) => second.startTime.getTime() - first.startTime.getTime()),
      },
    };
  }
}
