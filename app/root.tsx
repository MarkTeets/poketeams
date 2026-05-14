import "./app.css";

import {
  data,
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from "react-router";

import type { Route } from "./+types/root";
import AppNavLink from "./components/app-nav-link";
import { getCurrentUser } from "./utils/auth.server";

export function meta() {
  return [
    { title: "Poketeams" },
    { name: "description", content: "Welcome to Poketeams!" },
  ];
}

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getCurrentUser(request);
  console.log("root user:");
  console.log(user);
  return data({ isLoggedIn: user !== null });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <>
      <nav
        className="
          flex justify-between text-white
          md:w-16 md:flex-col
        "
      >
        <ul
          className="
            flex
            md:flex-col
          "
        >
          <AppNavLink to="/">Home</AppNavLink>
          <AppNavLink to="/app">App</AppNavLink>
        </ul>
        <ul>
          {loaderData.isLoggedIn ? (
            <AppNavLink to="/logout">Logout</AppNavLink>
          ) : (
            <AppNavLink to="/login">Login</AppNavLink>
          )}
        </ul>
      </nav>
      <div
        className="
          w-full p-4
          md:w-[calc(100%-4rem)]
        "
      >
        <Outlet />
      </div>
    </>
  );
}
export function ErrorBoundary() {
  const error = useRouteError();
  console.log(error);
  if (isRouteErrorResponse(error)) {
    return (
      <div className="p-4">
        <h1 className="pb-3 text-2xl">
          {error.status} - {error.statusText}
        </h1>
        <p>You&apos;re seeing this page because an error occurred.</p>
        <p className="my-4 font-bold">
          {/* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access */}
          {error.data?.message || error.data?.errors?.message}
        </p>
        <Link to="/">Take me home</Link>
      </div>
    );
  }

  let errorMessage = "Unknown error";
  if (error instanceof Error) {
    errorMessage = error.message;
  }

  return (
    <div className="p-4">
      <h1 className="pb-3 text-2xl">Whoops!</h1>
      <p>You&apos;re seeing this page because an unexpected error occurred.</p>
      <p className="my-4 font-bold">{errorMessage}</p>
      <Link to="/">Take me home</Link>
    </div>
  );
}
