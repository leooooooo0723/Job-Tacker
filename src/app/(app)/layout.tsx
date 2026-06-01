"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }
    setUsername(localStorage.getItem("username") ?? "");
    setRole(localStorage.getItem("role") ?? "user");
    setReady(true);
  }, [router]);

  if (!ready) return null;

  return (
    <div className="h-full flex">
      <Sidebar username={username} role={role} />
      <main className="flex-1 overflow-auto bg-background">{children}</main>
    </div>
  );
}
