import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Search, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const ALL_TAGS = ["国企", "银行", "外企", "互联网", "金融", "央企", "民企", "事业单位"];

interface Company {
  id: string;
  name: string;
  tags: string;
  recruitmentUrl: string;
  notes: string;
}

function parseTags(tags: string): string[] {
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  const [form, setForm] = useState({
    name: "",
    tags: [] as string[],
    recruitmentUrl: "",
    notes: "",
  });

  const load = () =>
    apiFetch("/api/companies")
      .then((r) => r.json())
      .then(setCompanies);

  useEffect(() => { load(); }, []);

  const filtered = companies.filter((c) => {
    const tags = parseTags(c.tags);
    const matchTag = !activeTag || tags.includes(activeTag);
    const matchSearch =
      !search || c.name.toLowerCase().includes(search.toLowerCase());
    return matchTag && matchSearch;
  });

  function openAdd() {
    setEditing(null);
    setForm({ name: "", tags: [], recruitmentUrl: "", notes: "" });
    setDialogOpen(true);
  }

  function openEdit(company: Company) {
    setEditing(company);
    setForm({
      name: company.name,
      tags: parseTags(company.tags),
      recruitmentUrl: company.recruitmentUrl,
      notes: company.notes,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.name || !form.recruitmentUrl) {
      toast.error("公司名称和招聘链接不能为空");
      return;
    }
    if (editing) {
      await apiFetch(`/api/companies/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      toast.success("已更新");
    } else {
      const res = await apiFetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "添加失败");
        return;
      }
      toast.success("已添加");
    }
    setDialogOpen(false);
    load();
  }

  async function remove(id: string, name: string) {
    if (!confirm(`确认删除「${name}」？`)) return;
    await apiFetch(`/api/companies/${id}`, { method: "DELETE" });
    toast.success("已删除");
    load();
  }

  function toggleTag(tag: string) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag)
        ? f.tags.filter((t) => t !== tag)
        : [...f.tags, tag],
    }));
  }

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">公司库</h2>
        <Button size="sm" onClick={openAdd}>
          <Plus size={14} className="mr-1" />
          添加公司
        </Button>
      </div>

      {/* 筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48 max-w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="搜索公司名"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Badge
          variant={!activeTag ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => setActiveTag(null)}
        >
          全部
        </Badge>
        {ALL_TAGS.map((tag) => (
          <Badge
            key={tag}
            variant={activeTag === tag ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
          >
            {tag}
          </Badge>
        ))}
      </div>

      <p className="text-xs text-gray-400">{filtered.length} 家公司</p>

      {/* 列表 */}
      <div className="grid gap-3">
        {filtered.map((company) => {
          const tags = parseTags(company.tags);
          return (
            <Card key={company.id}>
              <CardContent className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-medium text-sm truncate">{company.name}</span>
                  <div className="flex gap-1 flex-wrap">
                    {tags.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs px-1.5">
                        {t}
                      </Badge>
                    ))}
                  </div>
                  {company.notes && (
                    <span className="text-xs text-gray-400 truncate hidden md:block">
                      {company.notes}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <a
                    href={company.recruitmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink size={14} />
                  </a>
                  <button
                    onClick={() => openEdit(company)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => remove(company.id, company.name)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 py-8 text-center">
            暂无公司，点击右上角添加
          </p>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑公司" : "添加公司"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">公司名称</Label>
              <Input
                className="mt-1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="例：字节跳动"
              />
            </div>
            <div>
              <Label className="text-sm">招聘页面链接</Label>
              <Input
                className="mt-1"
                value={form.recruitmentUrl}
                onChange={(e) =>
                  setForm({ ...form, recruitmentUrl: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-sm mb-2 block">标签</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant={form.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">备注</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="可选"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={save}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
