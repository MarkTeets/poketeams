import { data } from "react-router";

import type { FieldErrors } from "~/types";

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
  return data(responseDataPackage(info), { status });
};

export const sendResponseError = (errors: FieldErrors, status = 400) => {
  return data(responseErrorPackage(errors), { status });
};
