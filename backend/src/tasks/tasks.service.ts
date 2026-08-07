import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

/** Shape returned to clients — nested relations flattened into plain fields. */
const taskInclude = {
  assignees: {
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  },
  labels: { include: { label: true } },
  subtasks: {
    orderBy: { position: 'asc' },
    include: {
      assignees: {
        include: { user: { select: { id: true, name: true, avatar: true } } },
      },
      labels: { include: { label: true } },
    },
  },
  project: { select: { id: true, name: true } },
  reporter: { select: { id: true, name: true, avatar: true } },
} as const;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTaskDto, reporterId: string) {
    await this.assertRelationsExist(dto);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        status: dto.status ?? 'To Do',
        priority: dto.priority ?? 'none',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        position:
          dto.position ?? (await this.nextPosition(dto.status ?? 'To Do')),
        projectId: dto.projectId,
        parentId: dto.parentId,
        reporterId,
        assignees: dto.assigneeIds?.length
          ? { create: dto.assigneeIds.map((userId) => ({ userId })) }
          : undefined,
        labels: dto.labels?.length
          ? { create: await this.connectLabels(dto.labels) }
          : undefined,
      },
      include: taskInclude,
    });

    return this.toResponse(task);
  }

  async findAll(query: QueryTasksDto) {
    const where = {
      // SQLite's LIKE is case-insensitive for ASCII, so `contains` suffices.
      ...(query.search ? { title: { contains: query.search } } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      // An explicit parentId wins: it scopes the query to one task's subtasks.
      ...(query.parentId
        ? { parentId: query.parentId }
        : query.includeSubtasks
          ? {}
          : { parentId: null }),
    };

    const [items, total] = await Promise.all([
      this.prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      items: items.map((task) => this.toResponse(task)),
      total,
      skip: query.skip ?? 0,
      take: query.take ?? 50,
    };
  }

  /** Tasks bucketed by status — the shape the board and grouped list consume. */
  async findGrouped(projectId?: string) {
    const tasks = await this.prisma.task.findMany({
      where: { parentId: null, ...(projectId ? { projectId } : {}) },
      include: taskInclude,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });

    const groups = new Map<string, ReturnType<typeof this.toResponse>[]>();
    for (const task of tasks) {
      const bucket = groups.get(task.status) ?? [];
      bucket.push(this.toResponse(task));
      groups.set(task.status, bucket);
    }

    return [...groups.entries()].map(([status, items]) => ({ status, items }));
  }

  async findOne(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: taskInclude,
    });

    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return this.toResponse(task);
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.assertExists(id);
    await this.assertRelationsExist(dto);

    if (dto.parentId === id) {
      throw new BadRequestException('A task cannot be its own parent');
    }

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
        ...(dto.projectId !== undefined ? { projectId: dto.projectId } : {}),
        ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
        // Assignees and labels are replaced wholesale when supplied.
        ...(dto.assigneeIds !== undefined
          ? {
              assignees: {
                deleteMany: {},
                create: dto.assigneeIds.map((userId) => ({ userId })),
              },
            }
          : {}),
        ...(dto.labels !== undefined
          ? {
              labels: {
                deleteMany: {},
                create: await this.connectLabels(dto.labels),
              },
            }
          : {}),
      },
      include: taskInclude,
    });

    return this.toResponse(task);
  }

  async remove(id: string) {
    await this.assertExists(id);
    // Subtasks, labels, assignees and comments cascade via the schema.
    await this.prisma.task.delete({ where: { id } });
    return { id, deleted: true };
  }

  // --- helpers -------------------------------------------------------------

  private async assertExists(id: string) {
    const found = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Task ${id} not found`);
  }

  /**
   * Validates foreign keys up front so a bad id returns 404/400 rather than a
   * raw Prisma constraint error.
   */
  private async assertRelationsExist(dto: CreateTaskDto | UpdateTaskDto) {
    if (dto.projectId) {
      const project = await this.prisma.project.findUnique({
        where: { id: dto.projectId },
        select: { id: true },
      });
      if (!project) {
        throw new NotFoundException(`Project ${dto.projectId} not found`);
      }
    }

    if (dto.parentId) {
      const parent = await this.prisma.task.findUnique({
        where: { id: dto.parentId },
        select: { id: true, parentId: true },
      });
      if (!parent) {
        throw new NotFoundException(`Parent task ${dto.parentId} not found`);
      }
      // One level of nesting only, matching the design's subtask table.
      if (parent.parentId) {
        throw new BadRequestException('Subtasks cannot be nested further');
      }
    }

    if (dto.assigneeIds?.length) {
      const found = await this.prisma.user.findMany({
        where: { id: { in: dto.assigneeIds } },
        select: { id: true },
      });
      if (found.length !== new Set(dto.assigneeIds).size) {
        throw new BadRequestException('One or more assignee ids are unknown');
      }
    }
  }

  /** Upserts label names and returns join rows for a nested create. */
  private async connectLabels(names: string[]) {
    const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
    const labels = await Promise.all(
      unique.map((name) =>
        this.prisma.label.upsert({
          where: { name },
          create: { name },
          update: {},
          select: { id: true },
        }),
      ),
    );
    return labels.map((label) => ({ labelId: label.id }));
  }

  /** Appends new tasks to the end of their column. */
  private async nextPosition(status: string) {
    const last = await this.prisma.task.findFirst({
      where: { status },
      orderBy: { position: 'desc' },
      select: { position: true },
    });
    return (last?.position ?? -1) + 1;
  }

  /** Flattens join tables so clients get plain arrays. */
  private toResponse(task: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    dueDate: Date | null;
    position: number;
    projectId: string | null;
    parentId: string | null;
    createdAt: Date;
    updatedAt: Date;
    assignees?: { user: { id: string; name: string; avatar: string | null } }[];
    labels?: { label: { id: string; name: string } }[];
    subtasks?: unknown[];
    project?: { id: string; name: string } | null;
    reporter?: { id: string; name: string; avatar: string | null } | null;
  }) {
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      position: task.position,
      projectId: task.projectId,
      parentId: task.parentId,
      project: task.project ?? null,
      reporter: task.reporter ?? null,
      members: task.assignees?.map((a) => a.user) ?? [],
      labels: task.labels?.map((l) => l.label.name) ?? [],
      subtaskCount: task.subtasks?.length ?? 0,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}
