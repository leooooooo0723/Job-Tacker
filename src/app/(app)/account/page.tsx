import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiFetch, clearToken } from "@/lib/api";

interface UserInfo {
  username: string;
  role: string;
  createdAt: string;
}

export default function AccountPage() {
  const navigate = useNavigate();
  const [info, setInfo] = useState<UserInfo | null>(null);

  const [pwForm, setPwForm] = useState({ oldPassword: "", newPassword: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    apiFetch("/api/account")
      .then((r) => r.json())
      .then(setInfo);
  }, []);

  async function changePassword() {
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error("两次输入的新密码不一致");
      return;
    }
    setPwLoading(true);
    const res = await apiFetch("/api/account", {
      method: "PUT",
      body: JSON.stringify({ oldPassword: pwForm.oldPassword, newPassword: pwForm.newPassword }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "修改失败");
    } else {
      toast.success("密码已修改");
      setPwForm({ oldPassword: "", newPassword: "", confirm: "" });
    }
  }

  async function deleteAccount() {
    if (deleteConfirm !== info?.username) {
      toast.error("用户名输入有误");
      return;
    }
    setDeleteLoading(true);
    const res = await apiFetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      clearToken();
      toast.success("账户已注销");
      navigate("/login");
    } else {
      toast.error("注销失败，请重试");
      setDeleteLoading(false);
    }
  }

  const formattedDate = info
    ? new Date(info.createdAt).toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">账户设置</h2>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">用户名</span>
            <span className="font-medium">{info?.username ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">角色</span>
            <span>{info?.role === "admin" ? "管理员" : "普通用户"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">注册时间</span>
            <span>{formattedDate}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">修改密码</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-sm">当前密码</Label>
            <Input
              type="password"
              className="mt-1"
              value={pwForm.oldPassword}
              onChange={(e) => setPwForm({ ...pwForm, oldPassword: e.target.value })}
              placeholder="输入当前密码"
            />
          </div>
          <div>
            <Label className="text-sm">新密码</Label>
            <Input
              type="password"
              className="mt-1"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="至少 6 位"
            />
          </div>
          <div>
            <Label className="text-sm">确认新密码</Label>
            <Input
              type="password"
              className="mt-1"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              placeholder="再次输入新密码"
            />
          </div>
          <Button onClick={changePassword} disabled={pwLoading} className="w-full mt-1">
            {pwLoading ? "保存中…" : "保存新密码"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-red-600">注销账户</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            注销后，账户及所有投递记录、面试安排、求职周期数据将被永久删除，无法恢复。
          </p>
          <div>
            <Label className="text-sm">
              请输入用户名 <span className="font-medium text-foreground">"{info?.username}"</span> 确认注销
            </Label>
            <Input
              className="mt-1"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder={info?.username ?? ""}
            />
          </div>
          <Button
            variant="destructive"
            onClick={deleteAccount}
            disabled={deleteLoading || deleteConfirm !== info?.username}
            className="w-full"
          >
            {deleteLoading ? "注销中…" : "确认注销账户"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
