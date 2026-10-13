import {
  ClassConstructor,
  plainToInstance,
  TransformFnParams,
} from 'class-transformer';

export function parseJsonArrayOf<T>(cls: ClassConstructor<T>) {
  return ({ value }: TransformFnParams): unknown => {
    if (typeof value !== 'string') return value;
    try {
      return plainToInstance(cls, JSON.parse(value) as unknown[]);
    } catch {
      return value;
    }
  };
}
