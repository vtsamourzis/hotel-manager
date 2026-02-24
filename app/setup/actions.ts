"use server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { createUser, isSetupComplete } from "@/lib/db/users"
import { redirect } from "next/navigation"

const setupSchema = z.object({
  name: z.string().min(2, "Το όνομα πρέπει να έχει τουλάχιστον 2 χαρακτήρες"),
  email: z.string().email("Μη έγκυρο email"),
  password: z.string().min(8, "Ο κωδικός πρέπει να έχει τουλάχιστον 8 χαρακτήρες"),
})

export async function setupAction(formData: FormData) {
  // Guard: if setup already done, return 403-equivalent
  if (isSetupComplete()) {
    return { error: "Η εγκατάσταση έχει ήδη ολοκληρωθεί." }
  }

  const parsed = setupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError.message }
  }

  const hash = await bcrypt.hash(parsed.data.password, 12)
  createUser(parsed.data.name, parsed.data.email, hash)

  redirect("/login")
}
