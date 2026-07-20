import type { MathErrorCode, MathResult } from "./types";

export const success = <T>(value: T): MathResult<T> => ({ ok: true, value });

export const failure = <T>(
  code: MathErrorCode,
  message: string,
): MathResult<T> => ({ ok: false, code, message });

export const allFinite = (values: readonly number[]): boolean =>
  values.every(Number.isFinite);
