import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";
import NewCaseForm from "./NewCaseForm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <NewCaseForm />;
}
