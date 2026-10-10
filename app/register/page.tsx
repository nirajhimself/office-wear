import Link from "next/link";
import { registerAction } from "@/lib/auth/actions";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-intro">
          <span className="eyebrow">OFFICE WEAR / JOIN</span>
          <h1>Create your account.</h1>
          <p>Save your details, track orders and build your OFFICE WEAR wardrobe.</p>
        </div>
        <form className="auth-form" action={registerAction}>
          {params.error && <div className="auth-error" role="alert">{params.error}</div>}
          <label>Name<input name="name" type="text" autoComplete="name" required /></label>
          <label>Email<input name="email" type="email" autoComplete="email" required /></label>
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
          <p className="auth-terms">By creating an account, you agree to our Terms & Conditions and Privacy Policy.</p>
          <button className="button button-dark" type="submit">CREATE ACCOUNT <span>→</span></button>
          <p className="auth-note">Already have an account? <Link href="/login">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
