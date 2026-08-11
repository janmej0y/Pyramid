import { Types } from 'mongoose';

/**
 * MongoDB exposes `_id`; the frontend (and the previous SQL schema) expect
 * `id`. These helpers do that translation in one place so no response shape
 * leaks Mongo-specific field names.
 */

export type MemberView = {
  id: string;
  name: string;
  avatar: string | null;
};

/** A populated ref is a document; an unpopulated one is just an ObjectId. */
type MaybePopulated<T> = T | Types.ObjectId | null | undefined;

function isPopulated<T extends object>(value: MaybePopulated<T>): value is T {
  return (
    value !== null &&
    value !== undefined &&
    !(value instanceof Types.ObjectId) &&
    typeof value === 'object'
  );
}

/** Stringifies an id whether the ref was populated or not. */
export function idOf(
  value: MaybePopulated<{ _id: Types.ObjectId }>,
): string | null {
  if (!value) return null;
  if (value instanceof Types.ObjectId) return value.toString();
  return value._id.toString();
}

/** Shapes a populated user ref into the member view the UI renders. */
export function toMember(
  value: MaybePopulated<{
    _id: Types.ObjectId;
    name: string;
    avatar?: string | null;
  }>,
): MemberView | null {
  if (!isPopulated(value)) return null;
  return {
    id: value._id.toString(),
    name: value.name,
    avatar: value.avatar ?? null,
  };
}

/** Maps an array of populated user refs, dropping any that failed to resolve. */
export function toMembers(
  values: MaybePopulated<{
    _id: Types.ObjectId;
    name: string;
    avatar?: string | null;
  }>[],
): MemberView[] {
  return (values ?? [])
    .map((value) => toMember(value))
    .filter((member): member is MemberView => member !== null);
}
