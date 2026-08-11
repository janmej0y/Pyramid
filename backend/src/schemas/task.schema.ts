import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PRIORITIES, STATUSES } from '../common/constants';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ timestamps: true, collection: 'tasks' })
export class Task {
  @Prop({ required: true, trim: true })
  title!: string;

  // Nullable fields need an explicit `type` — @nestjs/mongoose cannot infer a
  // schema type from a `string | null` union via reflection metadata.
  @Prop({ type: String, default: null })
  description?: string | null;

  /** Board column / list group. */
  @Prop({ required: true, enum: STATUSES, default: 'To Do' })
  status!: string;

  @Prop({ required: true, enum: PRIORITIES, default: 'none' })
  priority!: string;

  @Prop({ type: Date, default: null })
  dueDate?: Date | null;

  /** Manual ordering within a status column. */
  @Prop({ default: 0 })
  position!: number;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null, index: true })
  project?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reporter?: Types.ObjectId | null;

  /**
   * Self-reference powering the subtask table. One level deep — enforced in
   * TasksService rather than the schema, which cannot express it.
   */
  @Prop({ type: Types.ObjectId, ref: 'Task', default: null, index: true })
  parent?: Types.ObjectId | null;

  /**
   * Relational join tables collapse into embedded reference arrays here, which
   * keeps assignment order stable without a separate collection.
   */
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignees!: Types.ObjectId[];

  /** Label names are stored inline; they carry no data beyond the name. */
  @Prop({ type: [String], default: [] })
  labels!: string[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Supports the grouped board query, which always filters on these two.
TaskSchema.index({ status: 1, position: 1 });
