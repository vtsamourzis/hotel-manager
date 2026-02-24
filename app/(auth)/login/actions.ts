"use server"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/overview",
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Λάθος email ή κωδικός" }
    }
    throw error // Re-throw redirect — it is not an actual error
  }
}
