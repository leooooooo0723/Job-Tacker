import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./app/(app)/layout";
import AuthLayout from "./app/(auth)/layout";
import DashboardPage from "./app/(app)/page";
import ApplicationsPage from "./app/(app)/applications/page";
import CompaniesPage from "./app/(app)/companies/page";
import OffersPage from "./app/(app)/offers/page";
import ResumesPage from "./app/(app)/resumes/page";
import ChatPage from "./app/(app)/chat/page";
import AccountPage from "./app/(app)/account/page";
import LoginPage from "./app/(auth)/login/page";
import RegisterPage from "./app/(auth)/register/page";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="resumes" element={<ResumesPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="account" element={<AccountPage />} />
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
