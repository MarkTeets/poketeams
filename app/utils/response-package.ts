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

export const responseDataPackage = <T>(info: T) => {
  return {
    success: true,
    data: info,
    errors: undefined,
  };
};

export const responseErrorPackage = (errors: FieldErrors) => {
  return {
    success: false,
    data: undefined,
    errors,
  };
};

export const sendResponseData = <T>(info: T, status = 200) => {
  return sendData(responseDataPackage(info), { status });
};

export const sendResponseError = (errors: FieldErrors, status = 400) => {
  return sendData(responseErrorPackage(errors), { status });
};
