export type FieldErrors = { [key: string]: string };

export type FormFields = {
  [key: string]: FormDataEntryValue | FormDataEntryValue[];
};

export type ModelOk<T> = { ok: true; data: T | null };

export type ModelErr = {
  ok: false;
  message: string;
  constraint: string | null;
};

export type ModelResult<T> = ModelOk<T> | ModelErr;
