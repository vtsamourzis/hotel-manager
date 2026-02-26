import { isSetupComplete } from "@/lib/db/users"
import { redirect } from "next/navigation"
import { SetupForm } from "./SetupForm"

export default function SetupPage() {
  if (isSetupComplete()) redirect("/login")
  return <SetupForm />
}
