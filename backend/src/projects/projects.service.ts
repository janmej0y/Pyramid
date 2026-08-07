import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';

const projectInclude = {
  lead: { select: { id: true, name: true, avatar: true } },
  _count: { select: { tasks: true } },
} as const;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    await this.assertLeadExists(dto.leadId);

    const project = await this.prisma.project.create({
      data: {
        name: dto.name.trim(),
        priority: dto.priority ?? 'none',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        leadId: dto.leadId,
      },
      include: projectInclude,
    });

    return this.toResponse(project);
  }

  async findAll(query: QueryProjectsDto) {
    const where = {
      ...(query.search ? { name: { contains: query.search } } : {}),
      ...(query.priority ? { priority: query.priority } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: { createdAt: 'asc' },
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      items: items.map((project) => this.toResponse(project)),
      total,
      skip: query.skip ?? 0,
      take: query.take ?? 50,
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: projectInclude,
    });

    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return this.toResponse(project);
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.assertExists(id);
    await this.assertLeadExists(dto.leadId);

    const project = await this.prisma.project.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.leadId !== undefined ? { leadId: dto.leadId } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: dto.dueDate ? new Date(dto.dueDate) : null }
          : {}),
      },
      include: projectInclude,
    });

    return this.toResponse(project);
  }

  async remove(id: string) {
    await this.assertExists(id);
    // Tasks cascade with the project.
    await this.prisma.project.delete({ where: { id } });
    return { id, deleted: true };
  }

  private async assertExists(id: string) {
    const found = await this.prisma.project.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!found) throw new NotFoundException(`Project ${id} not found`);
  }

  private async assertLeadExists(leadId?: string) {
    if (!leadId) return;
    const lead = await this.prisma.user.findUnique({
      where: { id: leadId },
      select: { id: true },
    });
    if (!lead) throw new NotFoundException(`User ${leadId} not found`);
  }

  private toResponse(project: {
    id: string;
    name: string;
    priority: string;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    lead?: { id: string; name: string; avatar: string | null } | null;
    _count?: { tasks: number };
  }) {
    return {
      id: project.id,
      name: project.name,
      priority: project.priority,
      dueDate: project.dueDate,
      lead: project.lead ?? null,
      taskCount: project._count?.tasks ?? 0,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }
}
