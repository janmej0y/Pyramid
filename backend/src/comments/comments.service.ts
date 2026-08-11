import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import { Task } from '../schemas/task.schema';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { toMember } from '../common/serialize';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
    @InjectModel(Task.name) private readonly taskModel: Model<Task>,
  ) {}

  async create(taskId: string, dto: CreateCommentDto, authorId: string) {
    await this.assertTaskExists(taskId);

    if (dto.parentId) {
      if (!Types.ObjectId.isValid(dto.parentId)) {
        throw new NotFoundException(`Comment ${dto.parentId} not found`);
      }
      const parent = await this.commentModel.findById(dto.parentId).exec();
      if (!parent) {
        throw new NotFoundException(`Comment ${dto.parentId} not found`);
      }
      // A reply must belong to the same task, and threads stay one level deep.
      if (parent.task.toString() !== taskId) {
        throw new BadRequestException(
          'Parent comment belongs to a different task',
        );
      }
      if (parent.parent) {
        throw new BadRequestException('Replies cannot be nested further');
      }
    }

    const created = await this.commentModel.create({
      body: dto.body.trim(),
      task: new Types.ObjectId(taskId),
      author: new Types.ObjectId(authorId),
      parent: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
    });

    const populated = await this.commentModel
      .findById(created._id)
      .populate({ path: 'author', select: 'name avatar' })
      .exec();

    return this.toResponse(populated!, []);
  }

  /** Top-level comments for a task, each with its replies nested. */
  async findByTask(taskId: string) {
    await this.assertTaskExists(taskId);
    const objectId = new Types.ObjectId(taskId);

    const [roots, replies] = await Promise.all([
      this.commentModel
        .find({ task: objectId, parent: null })
        .populate({ path: 'author', select: 'name avatar' })
        .sort({ createdAt: 1 })
        .exec(),
      this.commentModel
        .find({ task: objectId, parent: { $ne: null } })
        .populate({ path: 'author', select: 'name avatar' })
        .sort({ createdAt: 1 })
        .exec(),
    ]);

    // Group replies by parent in one pass rather than querying per root.
    const byParent = new Map<string, CommentDocument[]>();
    for (const reply of replies) {
      const key = reply.parent!.toString();
      byParent.set(key, [...(byParent.get(key) ?? []), reply]);
    }

    return roots.map((root) =>
      this.toResponse(root, byParent.get(root._id.toString()) ?? []),
    );
  }

  async update(id: string, dto: UpdateCommentDto, userId: string) {
    const comment = await this.findOwned(id, userId);

    comment.body = dto.body.trim();
    await comment.save();

    const populated = await this.commentModel
      .findById(comment._id)
      .populate({ path: 'author', select: 'name avatar' })
      .exec();

    return this.toResponse(populated!, []);
  }

  async remove(id: string, userId: string) {
    const comment = await this.findOwned(id, userId);
    // Replies belong to the comment being removed.
    await this.commentModel
      .deleteMany({ $or: [{ _id: comment._id }, { parent: comment._id }] })
      .exec();
    return { id, deleted: true };
  }

  private async assertTaskExists(taskId: string) {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new NotFoundException(`Task ${taskId} not found`);
    }
    const exists = await this.taskModel.exists({ _id: taskId });
    if (!exists) throw new NotFoundException(`Task ${taskId} not found`);
  }

  /** Loads a comment and enforces that the caller wrote it. */
  private async findOwned(id: string, userId: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Comment ${id} not found`);
    }
    const comment = await this.commentModel.findById(id).exec();
    if (!comment) throw new NotFoundException(`Comment ${id} not found`);
    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('You can only modify your own comments');
    }
    return comment;
  }

  private toResponse(comment: CommentDocument, replies: CommentDocument[]) {
    return {
      id: comment._id.toString(),
      body: comment.body,
      author: toMember(comment.author),
      createdAt: (comment as unknown as { createdAt: Date }).createdAt,
      replies: replies.map((reply) => ({
        id: reply._id.toString(),
        body: reply.body,
        author: toMember(reply.author),
        createdAt: (reply as unknown as { createdAt: Date }).createdAt,
        replies: [],
      })),
    };
  }
}
