import { isSetupComplete } from "@/lib/db/users"
import { redirect } from "next/navigation"
import { LoginForm } from "./LoginForm"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  if (!isSetupComplete()) redirect("/setup")
  return <LoginForm />
}
