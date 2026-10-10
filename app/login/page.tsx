import Link from "next/link";
import { loginAction } from "@/lib/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-intro">
          <span className="eyebrow">OFFICE WEAR / ACCOUNT</span>
          <h1>Welcome back.</h1>
          <p>Keep your orders, saved pieces and preferences in one place.</p>
        </div>
        <form className="auth-form" action={loginAction}>
          {params.error && <div className="auth-error" role="alert">{params.error}</div>}
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
          <button className="button button-dark" type="submit">SIGN IN <span>→</span></button>
          <p className="auth-note">New to OFFICE WEAR? <Link href="/register">Create an account</Link></p>
        </form>
      </div>
    </div>
  );
}
