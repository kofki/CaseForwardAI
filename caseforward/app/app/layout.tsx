import { auth0 } from "@/lib/auth0";
import { redirect } from "next/navigation";

export const metadata = {
  title: "CaseForward",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth0.getSession();

  if (!session) {
    redirect("/auth/login");
  }

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "";
  const userInitials = userName
    .split(" ")
    .map((part) => part.trim()[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div suppressHydrationWarning>
      {children}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__userSession = ${JSON.stringify({
            name: userName,
            email: userEmail,
            initials: userInitials,
          })}`,
        }}
      />
    </div>
  );
}
