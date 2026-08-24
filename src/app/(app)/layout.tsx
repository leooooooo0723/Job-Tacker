import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

export default function AppLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setUsername(localStorage.getItem("username") ?? "");
    setRole(localStorage.getItem("role") ?? "user");
    setReady(true);
  }, [navigate]);

  if (!ready) return null;

  return (
    <div className="h-full flex">
      <Sidebar username={username} role={role} />
      <main className="flex-1 overflow-auto bg-background">
        <Outlet />
      </main>
    </div>
  );
}
