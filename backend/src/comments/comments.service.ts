import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

const commentInclude = {
  author: { select: { id: true, name: true, avatar: true } },
  replies: {
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  },
} as const;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(taskId: string, dto: CreateCommentDto, authorId: string) {
    await this.assertTaskExists(taskId);

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, taskId: true, parentId: true },
      });
      if (!parent) {
        throw new NotFoundException(`Comment ${dto.parentId} not found`);
      }
      // A reply must belong to the same task, and threads stay one level deep.
      if (parent.taskId !== taskId) {
        throw new BadRequestException(
          'Parent comment belongs to a different task',
        );
      }
      if (parent.parentId) {
        throw new BadRequestException('Replies cannot be nested further');
      }
    }

    return this.prisma.comment.create({
      data: {
        body: dto.body.trim(),
        taskId,
        authorId,
        parentId: dto.parentId,
      },
      include: commentInclude,
    });
  }

  /** Top-level comments for a task, each with its replies nested. */
  async findByTask(taskId: string) {
    await this.assertTaskExists(taskId);

    return this.prisma.comment.findMany({
      where: { taskId, parentId: null },
      include: commentInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async update(id: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.findOwned(id, userId);

    return this.prisma.comment.update({
      where: { id: comment.id },
      data: { body: dto.body.trim() },
      include: commentInclude,
    });
  }

  async remove(id: string, userId: string) {
    const comment = await this.findOwned(id, userId);
    await this.prisma.comment.delete({ where: { id: comment.id } });
    return { id: comment.id, deleted: true };
  }

  private async assertTaskExists(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true },
    });
    if (!task) throw new NotFoundException(`Task ${taskId} not found`);
  }

  /** Loads a comment and enforces that the caller wrote it. */
  private async findOwned(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only modify your own comments');
    }

    return comment;
  }
}
