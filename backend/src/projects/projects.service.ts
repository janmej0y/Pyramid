import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { Task } from '../schemas/task.schema';
import { User } from '../schemas/user.schema';
import { Comment } from '../schemas/comment.schema';
import { Activity } from '../schemas/activity.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { QueryProjectsDto } from './dto/query-projects.dto';
import { toMember } from '../common/serialize';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
  ) {}

  async create(dto: CreateProjectDto) {
    await this.assertLeadExists(dto.leadId);

    const project = await this.projectModel.create({
      name: dto.name.trim(),
      priority: dto.priority ?? 'none',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      lead: dto.leadId ? new Types.ObjectId(dto.leadId) : null,
    });

    return this.findOne(project._id.toString());
  }

  async findAll(query: QueryProjectsDto) {
    const filter: Record<string, unknown> = {};
    if (query.search) {
      filter.name = { $regex: this.escapeRegex(query.search), $options: 'i' };
    }
    if (query.priority) filter.priority = query.priority;

    const skip = query.skip ?? 0;
    const take = query.take ?? 50;

    const [items, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .populate({ path: 'lead', select: 'name avatar' })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.projectModel.countDocuments(filter).exec(),
    ]);

    const counts = await this.taskCounts(items.map((p) => p._id));

    return {
      items: items.map((p) =>
        this.toResponse(p, counts.get(p._id.toString()) ?? 0),
      ),
      total,
      skip,
      take,
    };
  }

  /**
   * Task counts for many projects in one aggregation, rather than a
   * countDocuments per row — the same N+1 that made the task board slow.
   */
  private async taskCounts(
    projectIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (projectIds.length === 0) return new Map();

    const rows = await this.taskModel
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$project', count: { $sum: 1 } } },
      ])
      .exec();

    return new Map(rows.map((row) => [row._id.toString(), row.count]));
  }

  async findOne(id: string) {
    const project = await this.findDocument(id);
    const counts = await this.taskCounts([project._id]);
    return this.toResponse(project, counts.get(project._id.toString()) ?? 0);
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findDocument(id);
    await this.assertLeadExists(dto.leadId);

    const patch: Record<string, unknown> = {};
    if (dto.name !== undefined) patch.name = dto.name.trim();
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.dueDate !== undefined) {
      patch.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.leadId !== undefined) {
      patch.lead = dto.leadId ? new Types.ObjectId(dto.leadId) : null;
    }

    await this.projectModel
      .updateOne({ _id: new Types.ObjectId(id) }, { $set: patch })
      .exec();
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findDocument(id);
    const objectId = new Types.ObjectId(id);

    // No cascading deletes in MongoDB — a project's tasks (and their comments)
    // are removed explicitly.
    const tasks = await this.taskModel
      .find({ project: objectId })
      .select('_id')
      .exec();
    const taskIds = tasks.map((t) => t._id);

    await Promise.all([
      this.projectModel.deleteOne({ _id: objectId }).exec(),
      this.taskModel.deleteMany({ project: objectId }).exec(),
      this.commentModel.deleteMany({ task: { $in: taskIds } }).exec(),
      this.activityModel.deleteMany({ task: { $in: taskIds } }).exec(),
    ]);

    return { id, deleted: true };
  }

  private async findDocument(id: string): Promise<ProjectDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    const project = await this.projectModel
      .findById(id)
      .populate({ path: 'lead', select: 'name avatar' })
      .exec();
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  private async assertLeadExists(leadId?: string | null) {
    // null/undefined both mean "no lead", which needs no lookup.
    if (!leadId) return;
    if (!Types.ObjectId.isValid(leadId)) {
      throw new NotFoundException(`User ${leadId} not found`);
    }
    const exists = await this.userModel.exists({ _id: leadId });
    if (!exists) throw new NotFoundException(`User ${leadId} not found`);
  }

  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private toResponse(project: ProjectDocument, taskCount = 0) {
    return {
      id: project._id.toString(),
      name: project.name,
      priority: project.priority,
      dueDate: project.dueDate ?? null,
      lead: toMember(project.lead),
      taskCount,
      createdAt: (project as unknown as { createdAt: Date }).createdAt,
      updatedAt: (project as unknown as { updatedAt: Date }).updatedAt,
    };
  }
}
