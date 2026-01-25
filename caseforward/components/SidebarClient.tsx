"use client";

import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";

interface SidebarClientProps {
  activePage?: "dashboard" | "cases" | "actions" | "chatbot";
}

export default function SidebarClient({ activePage }: SidebarClientProps) {
  const [userData, setUserData] = useState({
    name: "User",
    email: "user@email.com",
    initials: "U",
  });

  useEffect(() => {
    const windowData = (window as any).__userSession;
    if (windowData) {
      setUserData(windowData);
    }
  }, []);

  return (
    <Sidebar
      activePage={activePage}
      userName={userData.name}
      userEmail={userData.email}
      userInitials={userData.initials}
    />
  );
}
