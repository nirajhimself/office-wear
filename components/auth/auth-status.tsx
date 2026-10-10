import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";

export async function AuthStatus() {
  const user = await getCurrentUser();
  return user ? <Link href="/account" className="account-label">{user.name.split(" ")[0]}</Link> : <Link href="/login" className="account-label">Sign in</Link>;
}
