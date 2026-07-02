import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { CreateReportDto } from './dto/create-report.dto';
import type { UpdateReportDto } from './dto/update-report.dto';

const reportSelect = {
  createdAt: true,
  id: true,
  reason: true,
  reviewedAt: true,
  status: true,
  message: {
    select: {
      content: true,
      id: true,
    },
  },
  reportedUser: {
    select: {
      id: true,
      profile: {
        select: {
          displayName: true,
          username: true,
        },
      },
    },
  },
  reporter: {
    select: {
      id: true,
      profile: {
        select: {
          displayName: true,
          username: true,
        },
      },
    },
  },
} as const satisfies Prisma.ReportSelect;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReport(dto: CreateReportDto, reporter: AuthenticatedUser) {
    if (dto.reportedUserId === reporter.id) {
      throw new BadRequestException('You cannot report your own account');
    }

    const reportedUser = await this.prisma.user.findUnique({
      select: { id: true, status: true },
      where: { id: dto.reportedUserId },
    });

    if (!reportedUser || reportedUser.status !== 'active') {
      throw new NotFoundException('Reported user not found');
    }

    if (dto.messageId) {
      const message = await this.prisma.message.findUnique({
        select: { id: true, senderId: true },
        where: { id: dto.messageId },
      });

      if (!message || message.senderId !== dto.reportedUserId) {
        throw new BadRequestException('Message does not belong to the reported user');
      }
    }

    return this.prisma.report.create({
      data: {
        messageId: dto.messageId,
        reason: dto.reason.trim(),
        reportedUserId: dto.reportedUserId,
        reporterId: reporter.id,
      },
      select: {
        createdAt: true,
        id: true,
        status: true,
      },
    });
  }

  async listReports(user: AuthenticatedUser) {
    this.assertModerator(user);

    return this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      select: reportSelect,
      take: 100,
    });
  }

  async updateReport(reportId: string, dto: UpdateReportDto, user: AuthenticatedUser) {
    this.assertModerator(user);

    const report = await this.prisma.report.findUnique({
      select: {
        id: true,
        reportedUserId: true,
      },
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (dto.suspendReportedUser && user.role !== 'admin') {
      throw new ForbiddenException('Only admins can suspend users');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.suspendReportedUser) {
        await tx.user.update({
          data: { status: 'suspended' },
          where: { id: report.reportedUserId },
        });
      }

      return tx.report.update({
        data: {
          reviewedAt: dto.status === 'pending' ? null : new Date(),
          status: dto.suspendReportedUser ? 'action_taken' : dto.status,
        },
        select: reportSelect,
        where: { id: report.id },
      });
    });
  }

  private assertModerator(user: AuthenticatedUser) {
    if (user.role !== 'admin' && user.role !== 'moderator') {
      throw new ForbiddenException('Moderator access is required');
    }
  }
}
