import { auth0 } from "@/lib/auth0";
import Sidebar from "./Sidebar";

interface SidebarWithUserProps {
  activePage?: "dashboard" | "cases" | "actions" | "chatbot";
}

export default async function SidebarWithUser({
  activePage,
}: SidebarWithUserProps) {
  const session = await auth0.getSession();

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
    <Sidebar
      activePage={activePage}
      userName={userName}
      userEmail={userEmail}
      userInitials={userInitials}
    />
  );
}
