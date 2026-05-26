import { data as RRdata } from "react-router";

import type { FieldErrors } from "~/types";

export type ActionResponsePackage<T> = {
  success: boolean;
  data: T;
  errors: FieldErrors | undefined;
};

export const sendData = <T>(
  data: ActionResponsePackage<T>,
  init?: ResponseInit | number,
) => {
  return RRdata<ActionResponsePackage<T>>(data, init);
};

export const responseDataPackage = <T>(data: T) => {
  return {
    success: true,
    data: data,
    errors: undefined,
  } as const;
};

export const responseErrorPackage = (errors: FieldErrors) => {
  return {
    success: false,
    data: undefined,
    errors,
  } as const;
};

export const sendResponseData = <T>(data: T, status = 200) => {
  return sendData(responseDataPackage(data), { status });
};

export const sendResponseError = (errors: FieldErrors, status = 400) => {
  return sendData(responseErrorPackage(errors), { status });
};
