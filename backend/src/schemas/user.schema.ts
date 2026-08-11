import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name!: string;

  /**
   * Unique among users that have one, but guests have none.
   *
   * A partial index rather than `sparse`: sparse only skips *missing* fields,
   * so an explicit `email: null` still gets indexed and the second guest
   * collides with the first. `default: undefined` keeps the field absent.
   *
   * Nullable fields also need an explicit `type` — @nestjs/mongoose cannot
   * infer a schema type from a `string | null` union via reflection metadata.
   */
  @Prop({
    type: String,
    default: undefined,
    index: {
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } },
    },
  })
  email?: string | null;

  @Prop({ type: String, default: null })
  title?: string | null;

  @Prop({ type: String, default: null })
  username?: string | null;

  @Prop({ type: String, default: null })
  avatar?: string | null;

  /** Guests are created on demand by the guest-login flow. */
  @Prop({ default: false })
  isGuest!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
