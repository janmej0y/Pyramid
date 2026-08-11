import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PRIORITIES } from '../common/constants';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, enum: PRIORITIES, default: 'none' })
  priority!: string;

  @Prop({ type: Date, default: null })
  dueDate?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  lead?: Types.ObjectId | null;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
