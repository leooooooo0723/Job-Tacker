import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Building2, ClipboardList, MessageCircle, LogOut, FileText, Trophy } from "lucide-react";

const links = [
  { href: "/", label: "今日概览", icon: LayoutDashboard },
  { href: "/resumes", label: "简历管理", icon: FileText },
  { href: "/companies", label: "公司库", icon: Building2 },
  { href: "/applications", label: "投递追踪", icon: ClipboardList },
  { href: "/offers", label: "Offer 管理", icon: Trophy },
  { href: "/chat", label: "AI 助手", icon: MessageCircle },
];

interface Props {
  username: string;
  role: string;
}

export default function Sidebar({ username, role }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    navigate("/login");
  }

  return (
    <aside className="w-52 min-h-full bg-white border-r border-border flex flex-col py-6 px-3">
      <div className="px-3 mb-8">
        <h1 className="text-lg font-bold text-primary tracking-tight">OfferOS</h1>
        <Link
          to="/account"
          className="text-xs text-muted-foreground mt-0.5 truncate block hover:text-foreground transition-colors"
        >
          {username}
        </Link>
        {role === "admin" && (
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded mt-1 inline-block font-medium">
            管理员
          </span>
        )}
      </div>
      <nav className="flex flex-col gap-1 flex-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-2"
      >
        <LogOut size={16} />
        退出登录
      </button>
    </aside>
  );
}
