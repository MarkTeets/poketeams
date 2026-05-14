import { index, route, type RouteConfig } from "@react-router/dev/routes";

const testRoutes =
  process.env.TEST_MODE === "true"
    ? [
        route(
          "__test/last-magic-link",
          "routes/__test-routes__/last-magic-link.tsx",
        ),
        route("__test/reset", "routes/__test-routes__/reset.tsx"),
        route(
          "__test/expire-last-link",
          "routes/__test-routes__/expire-last-link.tsx",
        ),
      ]
    : [];

export default [
  index("routes/home.tsx"),
  route("app", "routes/app.tsx"),
  route("species-finder", "routes/species-finder.tsx"),
  route("species-detail", "routes/species-detail.tsx"),
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),
  route("validate-magic-link", "routes/validate-magic-link.tsx"),
  route("sign-up/complete", "routes/sign-up-complete.tsx"),
  ...testRoutes,
] satisfies RouteConfig;
