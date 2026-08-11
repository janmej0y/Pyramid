import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<Comment>;

@Schema({ timestamps: true, collection: 'comments' })
export class Comment {
  @Prop({ required: true, trim: true })
  body!: string;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  task!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author!: Types.ObjectId;

  /** Set for replies inside a thread; threads stay one level deep. */
  @Prop({ type: Types.ObjectId, ref: 'Comment', default: null, index: true })
  parent?: Types.ObjectId | null;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);
