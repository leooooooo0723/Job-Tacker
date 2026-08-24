import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, saveToken } from "@/lib/api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("两次密码不一致");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: form.username, password: form.password }),
      });
      if (res.ok) {
        const loginRes = await apiFetch("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: form.username, password: form.password }),
        });
        if (loginRes.ok) {
          const data = await loginRes.json();
          saveToken(data.token);
          localStorage.setItem("username", data.username);
          localStorage.setItem("role", data.role);
        }
        navigate("/");
      } else {
        const data = await res.json();
        setError(data.error ?? "注册失败");
      }
    } catch (err) {
      setError("无法连接到服务器，请确认后端已启动");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm mx-4 shadow-md">
      <CardHeader className="text-center pb-2">
        <p className="text-3xl font-bold text-primary tracking-tight">OfferOS</p>
        <p className="text-sm text-muted-foreground mt-1">创建你的账号</p>
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
              placeholder="至少2位"
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
              placeholder="至少4位"
              autoComplete="new-password"
              required
            />
          </div>
          <div>
            <Label htmlFor="confirm">确认密码</Label>
            <Input
              id="confirm"
              type="password"
              className="mt-1"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="再次输入密码"
              autoComplete="new-password"
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "注册中..." : "注册"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-4">
          已有账号？{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">
            登录
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
