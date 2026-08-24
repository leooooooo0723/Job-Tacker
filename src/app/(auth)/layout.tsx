import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-full flex items-center justify-center bg-gradient-to-b from-sky-50 to-white">
      <Outlet />
    </div>
  );
}
