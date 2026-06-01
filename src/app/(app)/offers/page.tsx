"use client";
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
import { Trophy, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import CycleSelector from "@/components/CycleSelector";

interface OfferDetail {
  department: string;
  base: string;
  salary: string;
  benefits: string;
}

interface OfferItem {
  id: string;
  positionName: string;
  company: { name: string };
  offer: OfferDetail | null;
}

const EMPTY_DETAIL: OfferDetail = {
  department: "",
  base: "",
  salary: "",
  benefits: "",
};

export default function OffersPage() {
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [items, setItems] = useState<OfferItem[]>([]);
  const [selected, setSelected] = useState<OfferItem | null>(null);
  const [form, setForm] = useState<OfferDetail>(EMPTY_DETAIL);
  const [saving, setSaving] = useState(false);

  const load = (cid: string | null) => {
    const url = cid ? `/api/offers?cycleId=${cid}` : "/api/offers";
    apiFetch(url).then((r) => r.json()).then(setItems);
  };

  useEffect(() => { load(cycleId); }, [cycleId]);

  function openEdit(item: OfferItem) {
    setSelected(item);
    setForm(item.offer ?? EMPTY_DETAIL);
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    const res = await apiFetch(`/api/offers/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      toast.error("保存失败");
      return;
    }
    toast.success("已保存");
    setSelected(null);
    load(cycleId);
  }

  function field(label: string, key: keyof OfferDetail, placeholder?: string, multiline?: boolean) {
    return (
      <div>
        <Label className="text-sm">{label}</Label>
        {multiline ? (
          <Textarea
            className="mt-1"
            rows={3}
            placeholder={placeholder}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        ) : (
          <Input
            className="mt-1"
            placeholder={placeholder}
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-amber-500" />
          <h2 className="text-xl font-semibold text-gray-900">Offer 管理</h2>
        </div>
        <CycleSelector value={cycleId} onChange={setCycleId} />
      </div>

      <p className="text-xs text-gray-400">
        {items.length > 0
          ? `共 ${items.length} 个 Offer，点击查看 / 编辑详情`
          : "暂无 Offer，将投递状态更新为【offer】后会自动出现"}
      </p>

      <div className="grid gap-3">
        {items.map((item) => {
          const hasDetail = !!item.offer?.salary || !!item.offer?.department;
          return (
            <Card
              key={item.id}
              className="cursor-pointer hover:shadow-sm transition-shadow"
              onClick={() => openEdit(item)}
            >
              <CardContent className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <Trophy size={14} className="text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">
                      {item.company.name}
                      {item.positionName && (
                        <span className="text-gray-400 font-normal"> · {item.positionName}</span>
                      )}
                    </p>
                    {hasDetail ? (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {[item.offer?.department, item.offer?.base, item.offer?.salary]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500 mt-0.5">点击填写 Offer 详情</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {!hasDetail && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      待填写
                    </Badge>
                  )}
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {items.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">
            <Trophy size={36} className="mx-auto mb-3 text-gray-200" />
            暂无 Offer
          </div>
        )}
      </div>

      {/* 编辑弹窗 */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>Offer 详情</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* 只读信息 */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-gray-500">公司名称</Label>
                    <p className="mt-1 text-sm font-medium">{selected.company.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">岗位名称</Label>
                    <p className="mt-1 text-sm font-medium">{selected.positionName || "—"}</p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-3">
                  {field("部门", "department", "例：产品部、技术中台")}
                  {field("Base 地点", "base", "例：北京、上海")}
                  {field("薪资", "salary", "例：25K×16、月薪30K")}
                  {field("其他福利", "benefits", "例：五险一金、年终奖、期权…", true)}
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    取消
                  </Button>
                  <Button onClick={save} disabled={saving}>
                    {saving ? "保存中…" : "保存"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
