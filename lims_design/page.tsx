import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to dashboard (or /login if not authenticated)
  redirect("/dashboard");
}