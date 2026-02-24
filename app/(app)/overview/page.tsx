import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { OverviewPage } from "@/components/overview/OverviewPage";

export default async function OverviewPageRoute() {
  const session = await auth();
  if (!session) redirect("/login");

  return <OverviewPage session={session} />;
}
