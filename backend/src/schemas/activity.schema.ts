import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ACTIVITY_KINDS } from '../common/constants';

export type ActivityDocument = HydratedDocument<Activity>;

/** Feeds the "Updates" panel on the task detail screen. */
@Schema({ timestamps: true, collection: 'activities' })
export class Activity {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  task!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  actor!: Types.ObjectId;

  @Prop({ required: true, enum: ACTIVITY_KINDS })
  kind!: string;

  @Prop({ type: String, default: null })
  field?: string | null;

  @Prop({ type: String, default: null })
  fromValue?: string | null;

  @Prop({ type: String, default: null })
  toValue?: string | null;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
