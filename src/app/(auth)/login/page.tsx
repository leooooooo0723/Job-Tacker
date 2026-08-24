import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, saveToken } from "@/lib/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const data = await res.json();
        saveToken(data.token);
        localStorage.setItem("username", data.username);
        localStorage.setItem("role", data.role);
        navigate("/");
      } else {
        let msg = "登录失败";
        try { msg = (await res.json()).error ?? msg; } catch {}
        setError(msg);
      }
    } catch (err) {
      setError(`无法连接到服务器（${(err as Error).message ?? err}）`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm mx-4 shadow-md">
      <CardHeader className="text-center pb-2">
        <p className="text-3xl font-bold text-primary tracking-tight">OfferOS</p>
        <p className="text-sm text-muted-foreground mt-1">你的求职进度管理平台</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              className="mt-1"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="请输入用户名"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              className="mt-1"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="请输入密码"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          还没有账号？{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            注册
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
