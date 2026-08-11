import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { Project } from '../schemas/project.schema';
import { User } from '../schemas/user.schema';
import { Comment } from '../schemas/comment.schema';
import { Activity } from '../schemas/activity.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { idOf, toMember, toMembers } from '../common/serialize';

/** Refs hydrated on every task response. */
const POPULATE = [
  { path: 'assignees', select: 'name avatar' },
  { path: 'reporter', select: 'name avatar' },
  { path: 'project', select: 'name' },
];

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Activity.name) private readonly activityModel: Model<Activity>,
  ) {}

  async create(dto: CreateTaskDto, reporterId: string) {
    await this.assertRelationsExist(dto);

    const status = dto.status ?? 'To Do';

    const task = await this.taskModel.create({
      title: dto.title.trim(),
      description: dto.description?.trim() ?? null,
      status,
      priority: dto.priority ?? 'none',
      dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      position: dto.position ?? (await this.nextPosition(status)),
      project: dto.projectId ? new Types.ObjectId(dto.projectId) : null,
      parent: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      reporter: new Types.ObjectId(reporterId),
      assignees: (dto.assigneeIds ?? []).map((id) => new Types.ObjectId(id)),
      labels: this.normaliseLabels(dto.labels),
    });

    return this.findOne(task._id.toString());
  }

  async findAll(query: QueryTasksDto) {
    const filter: Record<string, unknown> = {};

    // Anchored, escaped regex: MongoDB has no LIKE, and an unescaped user
    // string would otherwise be interpreted as a pattern.
    if (query.search) {
      filter.title = { $regex: this.escapeRegex(query.search), $options: 'i' };
    }
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.projectId) filter.project = new Types.ObjectId(query.projectId);

    // An explicit parentId scopes to one task's subtasks; otherwise top-level
    // only, unless the caller opts into a flat list.
    if (query.parentId) {
      filter.parent = new Types.ObjectId(query.parentId);
    } else if (!query.includeSubtasks) {
      filter.parent = null;
    }

    const skip = query.skip ?? 0;
    const take = query.take ?? 50;

    const [items, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .populate(POPULATE)
        .sort({ position: 1, createdAt: 1 })
        .skip(skip)
        .limit(take)
        .exec(),
      this.taskModel.countDocuments(filter).exec(),
    ]);

    return {
      items: await Promise.all(items.map((task) => this.toResponse(task))),
      total,
      skip,
      take,
    };
  }

  /** Tasks bucketed by status — the shape the board and grouped list consume. */
  async findGrouped(projectId?: string) {
    const filter: Record<string, unknown> = { parent: null };
    if (projectId) filter.project = new Types.ObjectId(projectId);

    const tasks = await this.taskModel
      .find(filter)
      .populate(POPULATE)
      .sort({ position: 1, createdAt: 1 })
      .exec();

    const groups = new Map<
      string,
      Awaited<ReturnType<typeof this.toResponse>>[]
    >();
    for (const task of tasks) {
      const view = await this.toResponse(task);
      const bucket = groups.get(task.status) ?? [];
      bucket.push(view);
      groups.set(task.status, bucket);
    }

    return [...groups.entries()].map(([status, items]) => ({ status, items }));
  }

  async findOne(id: string) {
    const task = await this.findDocument(id);
    return this.toResponse(task);
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.findDocument(id);
    await this.assertRelationsExist(dto);

    if (dto.parentId === id) {
      throw new BadRequestException('A task cannot be its own parent');
    }

    const patch: Record<string, unknown> = {};
    if (dto.title !== undefined) patch.title = dto.title.trim();
    if (dto.description !== undefined)
      patch.description = dto.description.trim();
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.priority !== undefined) patch.priority = dto.priority;
    if (dto.position !== undefined) patch.position = dto.position;
    if (dto.dueDate !== undefined) {
      patch.dueDate = dto.dueDate ? new Date(dto.dueDate) : null;
    }
    if (dto.projectId !== undefined) {
      patch.project = dto.projectId ? new Types.ObjectId(dto.projectId) : null;
    }
    if (dto.parentId !== undefined) {
      patch.parent = dto.parentId ? new Types.ObjectId(dto.parentId) : null;
    }
    // Assignees and labels are replaced wholesale when supplied.
    if (dto.assigneeIds !== undefined) {
      patch.assignees = dto.assigneeIds.map((uid) => new Types.ObjectId(uid));
    }
    if (dto.labels !== undefined) {
      patch.labels = this.normaliseLabels(dto.labels);
    }

    await this.taskModel
      .updateOne({ _id: new Types.ObjectId(id) }, { $set: patch })
      .exec();
    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findDocument(id);
    const objectId = new Types.ObjectId(id);

    // MongoDB has no cascading deletes, so dependents are removed explicitly.
    const subtasks = await this.taskModel
      .find({ parent: objectId })
      .select('_id')
      .exec();
    const ids = [objectId, ...subtasks.map((sub) => sub._id)];

    await Promise.all([
      this.taskModel.deleteMany({ _id: { $in: ids } }).exec(),
      this.commentModel.deleteMany({ task: { $in: ids } }).exec(),
      this.activityModel.deleteMany({ task: { $in: ids } }).exec(),
    ]);

    return { id, deleted: true };
  }

  // --- helpers -------------------------------------------------------------

  /** Loads a task, rejecting malformed ids before they reach the driver. */
  private async findDocument(id: string): Promise<TaskDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Task ${id} not found`);
    }
    const task = await this.taskModel.findById(id).populate(POPULATE).exec();
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  /**
   * Validates foreign keys up front so a bad id returns 404/400 rather than a
   * confusing driver-level failure.
   */
  private async assertRelationsExist(dto: CreateTaskDto | UpdateTaskDto) {
    if (dto.projectId) {
      if (!Types.ObjectId.isValid(dto.projectId)) {
        throw new NotFoundException(`Project ${dto.projectId} not found`);
      }
      const exists = await this.projectModel.exists({ _id: dto.projectId });
      if (!exists) {
        throw new NotFoundException(`Project ${dto.projectId} not found`);
      }
    }

    if (dto.parentId) {
      if (!Types.ObjectId.isValid(dto.parentId)) {
        throw new NotFoundException(`Parent task ${dto.parentId} not found`);
      }
      const parent = await this.taskModel
        .findById(dto.parentId)
        .select('parent')
        .exec();
      if (!parent) {
        throw new NotFoundException(`Parent task ${dto.parentId} not found`);
      }
      // One level of nesting only, matching the design's subtask table.
      if (parent.parent) {
        throw new BadRequestException('Subtasks cannot be nested further');
      }
    }

    if (dto.assigneeIds?.length) {
      if (!dto.assigneeIds.every((id) => Types.ObjectId.isValid(id))) {
        throw new BadRequestException('One or more assignee ids are unknown');
      }
      const found = await this.userModel
        .countDocuments({ _id: { $in: dto.assigneeIds } })
        .exec();
      if (found !== new Set(dto.assigneeIds).size) {
        throw new BadRequestException('One or more assignee ids are unknown');
      }
    }
  }

  private normaliseLabels(labels?: string[]) {
    return [...new Set((labels ?? []).map((l) => l.trim()).filter(Boolean))];
  }

  /** Appends new tasks to the end of their column. */
  private async nextPosition(status: string) {
    const last = await this.taskModel
      .findOne({ status })
      .sort({ position: -1 })
      .select('position')
      .exec();
    return (last?.position ?? -1) + 1;
  }

  /** Escapes regex metacharacters so search input is treated literally. */
  private escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Flattens the document into the JSON shape the frontend consumes. */
  private async toResponse(task: TaskDocument) {
    const subtaskCount = await this.taskModel
      .countDocuments({ parent: task._id })
      .exec();

    const project = task.project as unknown as {
      _id: Types.ObjectId;
      name: string;
    } | null;

    return {
      id: task._id.toString(),
      title: task.title,
      description: task.description ?? null,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ?? null,
      position: task.position,
      projectId: idOf(task.project),
      parentId: idOf(task.parent),
      project:
        project && typeof project === 'object' && 'name' in project
          ? { id: project._id.toString(), name: project.name }
          : null,
      reporter: toMember(task.reporter),
      members: toMembers(task.assignees),
      labels: task.labels ?? [],
      subtaskCount,
      createdAt: (task as unknown as { createdAt: Date }).createdAt,
      updatedAt: (task as unknown as { updatedAt: Date }).updatedAt,
    };
  }
}
