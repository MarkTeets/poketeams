import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("sign-up", "routes/sign-up.tsx"),
] satisfies RouteConfig;
