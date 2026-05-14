import { redirect } from "next/navigation";

/** Legacy URL — canonical registration lives at `/register`. */
export default function SignupPage() {
  redirect("/register");
}
