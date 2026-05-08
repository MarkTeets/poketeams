import type { Route } from "./+types/login";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  
}

export default function Login() {
  return (
    <form method="post">
      <label htmlFor="email">Email</label>
      <input type="email" name="email" id="email" placeholder="email" />
      <label htmlFor="password">Password</label>
      <input type="text" name="password" id="password" placeholder="password" />
      <button>Login</button>
    </form>
  );
}
