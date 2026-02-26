import { isSetupComplete } from "@/lib/db/users"
import { redirect } from "next/navigation"
import { LoginForm } from "./LoginForm"

export default function LoginPage() {
  if (!isSetupComplete()) redirect("/setup")
  return <LoginForm />
}
