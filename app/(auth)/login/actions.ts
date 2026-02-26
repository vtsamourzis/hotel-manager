"use server"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false, // Session cookie is set, but navigation handled client-side
    })
    return { success: true as const }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Λάθος email ή κωδικός" }
    }
    throw error
  }
}
