import z from "zod";

import type { FieldErrors, FormFields } from "~/types";

import { sendResponseError } from "./response-package";

/**
 * Converts FormData objects to objects that can be digested by zod.
 * Includes specific way to interpret list type submissions that include
 * multiple values for a single field label
 * @param formData
 * @returns
 */
function objectify(formData: FormData) {
  const formFields: FormFields = {};

  formData.forEach((value, name) => {
    const isArrayField = name.endsWith("[]");
    const fieldName = isArrayField ? name.slice(0, -2) : name;

    if (!Object.hasOwn(formFields, fieldName)) {
      formFields[fieldName] = isArrayField ? formData.getAll(name) : value;
    }
  });
  return formFields;
}

export function validateForm<T, S>(
  formData: FormData,
  zodSchema: z.Schema<T>,
  successFn: (data: T) => S,
) {
  const fields = objectify(formData);
  const result = zodSchema.safeParse(fields);
  // console.log('formData:');
  // console.log(formData);
  if (!result.success) {
    const errors: FieldErrors = {};
    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      errors[path] = issue.message;
    });
    // console.log('failed; errors:');
    // console.log(errors);
    return sendResponseError(errors);
  }
  // console.log('success; result:')
  // console.log(result)
  return successFn(result.data);
}
