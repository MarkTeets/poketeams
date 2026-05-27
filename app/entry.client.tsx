import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { type ClientOnErrorFunction } from "react-router";
import { HydratedRouter } from "react-router/dom";

const onError: ClientOnErrorFunction = (
  error,
  { location, params, unstable_pattern, errorInfo },
) => {
  //myReportError(error, location, errorInfo);
  console.log("React router client error");
  console.log("location:");
  console.log(location);
  console.log("params");
  console.log(params);
  console.log("unstable_pattern");
  console.log(unstable_pattern);
  console.log("errorInfo");
  console.log(errorInfo);
  console.log("error");
  console.log(error);
};

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter onError={onError} />
    </StrictMode>,
  );
});
