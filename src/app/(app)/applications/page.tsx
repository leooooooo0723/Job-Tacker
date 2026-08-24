import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, CalendarPlus, Trash2, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import CycleSelector from "@/components/CycleSelector";
import StatusPipeline from "@/components/StatusPipeline";
import { APPLICATION_STATUSES, FAIL_NODE_LABELS } from "@/lib/constants";

interface Company {
  id: string;
  name: string;
  tags: string;
}

interface AppEvent {
  id: string;
  type: string;
  scheduledAt: string;
  link: string;
  notes: string;
}

interface Application {
  id: string;
  companyId: string;
  positionName: string;
  jdLink: string;
  base: string;
  status: string;
  failNode: string | null;
  appliedAt: string;
  notes: string;
  company: Company;
  events: AppEvent[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  interview: "面试",
  written_test: "笔试",
  assessment: "测评",
};

const EMPTY_APP_FORM = {
  companyId: "",
  positionName: "",
  jdLink: "",
  base: "",
  status: "已投递",
  notes: "",
};

export default function ApplicationsPage() {
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedApps, setExpandedApps] = useState<Set<string>>(new Set());

  const [addAppOpen, setAddAppOpen] = useState(false);
  const [addAppLockedCompanyId, setAddAppLockedCompanyId] = useState<string | null>(null);
  const [appForm, setAppForm] = useState({ ...EMPTY_APP_FORM });

  const [addEventOpen, setAddEventOpen] = useState(false);
  const [eventAppId, setEventAppId] = useState("");
  const [eventForm, setEventForm] = useState({
    type: "interview",
    scheduledAt: "",
    link: "",
    notes: "",
  });

  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState("");

  const [failNodeDialogOpen, setFailNodeDialogOpen] = useState(false);
  const [pendingFailAppId, setPendingFailAppId] = useState<string | null>(null);
  const [selectedFailNode, setSelectedFailNode] = useState<string>(FAIL_NODE_LABELS[0]);
  const [companySearch, setCompanySearch] = useState("");
  const [showCompanyDrop, setShowCompanyDrop] = useState(false);
  const [showBaseDrop, setShowBaseDrop] = useState(false);

  const loadApps = useCallback(() => {
    // cycleId=null 表示"全部周期"，不带 filter；有值则按周期过滤
    const url = cycleId ? `/api/applications?cycleId=${cycleId}` : "/api/applications";
    apiFetch(url).then((r) => r.json()).then(setApplications);
  }, [cycleId]);

  useEffect(() => { loadApps(); }, [loadApps]);
  useEffect(() => {
    apiFetch("/api/companies").then((r) => r.json()).then(setCompanies);
  }, []);

  function toggleCompany(companyId: string) {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      next.has(companyId) ? next.delete(companyId) : next.add(companyId);
      return next;
    });
  }

  function toggleApp(appId: string) {
    setExpandedApps((prev) => {
      const next = new Set(prev);
      next.has(appId) ? next.delete(appId) : next.add(appId);
      return next;
    });
  }

  function openAddApp(lockedCompanyId: string | null) {
    setAddAppLockedCompanyId(lockedCompanyId);
    setAppForm({ ...EMPTY_APP_FORM, companyId: lockedCompanyId ?? "" });
    setCompanySearch("");
    setShowCompanyDrop(false);
    setAddAppOpen(true);
  }

  async function submitAddApp() {
    if (!appForm.companyId || !cycleId) return;
    if (!appForm.positionName.trim()) {
      toast.error("请填写岗位名称");
      return;
    }
    const res = await apiFetch("/api/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...appForm, cycleId }),
    });
    if (!res.ok) { toast.error("添加失败"); return; }
    toast.success("已添加岗位");
    setAddAppOpen(false);
    // 自动展开该公司
    setExpandedCompanies((prev) => new Set(prev).add(appForm.companyId));
    loadApps();
  }

  async function updateStatus(id: string, status: string) {
    if (status === "已挂") {
      setPendingFailAppId(id);
      setSelectedFailNode(FAIL_NODE_LABELS[0]);
      setFailNodeDialogOpen(true);
      return;
    }
    await apiFetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status, failNode: null } : a))
    );
  }

  async function confirmFail() {
    if (!pendingFailAppId) return;
    await apiFetch(`/api/applications/${pendingFailAppId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "已挂", failNode: selectedFailNode }),
    });
    setApplications((prev) =>
      prev.map((a) =>
        a.id === pendingFailAppId
          ? { ...a, status: "已挂", failNode: selectedFailNode }
          : a
      )
    );
    setFailNodeDialogOpen(false);
    setPendingFailAppId(null);
  }

  async function saveNotes(id: string, notes: string) {
    await apiFetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
  }

  async function deleteApp(id: string, label: string) {
    if (!confirm(`确认删除「${label}」的投递记录？`)) return;
    await apiFetch(`/api/applications/${id}`, { method: "DELETE" });
    toast.success("已删除");
    loadApps();
  }

  async function addEvent() {
    if (!eventForm.scheduledAt) { toast.error("请填写时间"); return; }
    await apiFetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: eventAppId, ...eventForm }),
    });
    toast.success("已添加安排");
    setAddEventOpen(false);
    setEventForm({ type: "interview", scheduledAt: "", link: "", notes: "" });
    loadApps();
  }

  async function deleteEvent(id: string) {
    await apiFetch(`/api/events/${id}`, { method: "DELETE" });
    loadApps();
  }

  async function createCycle() {
    if (!newCycleName) return;
    await apiFetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCycleName }),
    });
    toast.success("已创建新周期");
    setCycleDialogOpen(false);
    setNewCycleName("");
    window.location.reload();
  }

  // 按公司分组
  const grouped = Object.values(
    applications.reduce(
      (acc, app) => {
        if (!acc[app.companyId]) acc[app.companyId] = { company: app.company, items: [] };
        acc[app.companyId].items.push(app);
        return acc;
      },
      {} as Record<string, { company: Company; items: Application[] }>
    )
  );

  const lockedCompany = addAppLockedCompanyId
    ? companies.find((c) => c.id === addAppLockedCompanyId)
    : null;

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      {/* 顶栏 */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-semibold text-gray-900">投递追踪</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setCycleDialogOpen(true)}>
            <Plus size={14} className="mr-1" />
            新建周期
          </Button>
          <CycleSelector value={cycleId} onChange={setCycleId} />
          {cycleId && (
            <Button size="sm" onClick={() => openAddApp(null)}>
              <Plus size={14} className="mr-1" />
              新增投递
            </Button>
          )}
        </div>
      </div>

      {/* 投递平台快捷入口 */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground shrink-0">快捷投递：</span>
        {[
          { label: "BOSS直聘", url: "https://www.zhipin.com/wuhan/?seoRefer=index" },
          { label: "牛客", url: "https://www.nowcoder.com/" },
          { label: "应届生", url: "https://www.yingjiesheng.com/" },
          { label: "国家大学生就业", url: "https://www.ncss.cn/" },
          { label: "实习僧", url: "https://hr.shixiseng.com/join?utm_source=seo-gw-B-26-0324-03" },
          { label: "中国公共招聘网", url: "http://job.mohrss.gov.cn/" },
        ].map(({ label, url }) => (
          <a
            key={label}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-border bg-background text-muted-foreground hover:text-primary hover:border-primary transition-colors"
          >
            {label}
            <ExternalLink size={10} />
          </a>
        ))}
      </div>

      {/* 内容 */}
      {grouped.length === 0 ? (
        <p className="text-sm text-gray-400 py-12 text-center">
          暂无投递记录{cycleId ? "，点击「新增投递」开始" : ""}
        </p>
      ) : (
        <div className="space-y-3">
          {grouped.map(({ company, items }) => {
            const isExpanded = expandedCompanies.has(company.id);
            return (
              <Card key={company.id} className="overflow-hidden">
                {/* 公司行 */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCompany(company.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-sm">{company.name}</span>
                    <span className="text-xs text-muted-foreground">{items.length} 个岗位</span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </button>

                {/* 岗位列表 */}
                {isExpanded && (
                  <div className="border-t divide-y">
                    {items.map((app) => {
                      const isAppExpanded = expandedApps.has(app.id);
                      return (
                        <div key={app.id}>
                          {/* 岗位行 */}
                          <div className="px-4 py-3 flex gap-3">
                            {/* 岗位信息（两行：名称 + 进度管道） */}
                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">
                                  {app.positionName || <span className="text-muted-foreground">未填写岗位</span>}
                                </span>
                                {app.base && (
                                  <span className="text-xs text-muted-foreground">{app.base}</span>
                                )}
                                {app.jdLink && (
                                  <a
                                    href={app.jdLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-xs text-primary hover:underline flex items-center gap-0.5"
                                  >
                                    JD <ExternalLink size={10} />
                                  </a>
                                )}
                              </div>
                              <StatusPipeline status={app.status} failNode={app.failNode} />
                            </div>

                            {/* 操作区 */}
                            <div className="flex items-start gap-1 shrink-0 pt-0.5">
                              <Select
                                value={app.status}
                                onValueChange={(v) => { if (!v) return; updateStatus(app.id, v); }}
                              >
                                <SelectTrigger className="h-7 text-xs w-28">
                                  <span>{app.status}</span>
                                </SelectTrigger>
                                <SelectContent>
                                  {APPLICATION_STATUSES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <button
                                className="text-muted-foreground hover:text-primary p-1"
                                title="添加安排"
                                onClick={() => { setEventAppId(app.id); setAddEventOpen(true); }}
                              >
                                <CalendarPlus size={14} />
                              </button>
                              <button
                                className="text-muted-foreground hover:text-red-500 p-1"
                                title="删除岗位"
                                onClick={() => deleteApp(app.id, `${company.name} · ${app.positionName || "该岗位"}`)}
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                className="text-muted-foreground hover:text-gray-700 p-1"
                                title={isAppExpanded ? "收起" : "展开安排/备注"}
                                onClick={() => toggleApp(app.id)}
                              >
                                {isAppExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                              </button>
                            </div>
                          </div>

                          {/* 展开：安排 + 备注 */}
                          {isAppExpanded && (
                            <div className="px-4 pb-3 bg-muted/30 space-y-3">
                              <p className="text-xs text-muted-foreground pt-2">
                                投递于 {format(new Date(app.appliedAt), "MM/dd HH:mm")}
                              </p>

                              {app.events.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-medium text-gray-600">安排记录</p>
                                  {app.events.map((ev) => (
                                    <div
                                      key={ev.id}
                                      className="flex items-center justify-between text-xs bg-background rounded px-2 py-1.5 border"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs px-1.5">
                                          {EVENT_TYPE_LABELS[ev.type] ?? ev.type}
                                        </Badge>
                                        <span>{format(new Date(ev.scheduledAt), "MM/dd HH:mm")}</span>
                                        {ev.link && (
                                          <a
                                            href={ev.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline flex items-center gap-0.5"
                                          >
                                            链接 <ExternalLink size={10} />
                                          </a>
                                        )}
                                        {ev.notes && (
                                          <span className="text-muted-foreground">{ev.notes}</span>
                                        )}
                                      </div>
                                      <button
                                        className="text-muted-foreground hover:text-red-400"
                                        onClick={() => deleteEvent(ev.id)}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div>
                                <p className="text-xs font-medium text-gray-600 mb-1">备注</p>
                                <Textarea
                                  className="text-xs resize-none bg-background"
                                  rows={2}
                                  defaultValue={app.notes}
                                  placeholder="添加备注..."
                                  onBlur={(e) => saveNotes(app.id, e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* 新增岗位按钮 */}
                    <div className="px-4 py-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-muted-foreground hover:text-primary"
                        onClick={() => openAddApp(company.id)}
                      >
                        <Plus size={12} className="mr-1" />
                        新增岗位
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 新增投递 / 新增岗位弹窗 */}
      <Dialog open={addAppOpen} onOpenChange={setAddAppOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{addAppLockedCompanyId ? "新增岗位" : "新增投递"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {addAppLockedCompanyId ? (
              <div>
                <Label className="text-sm">公司</Label>
                <div className="mt-1 px-3 py-2 border rounded-md text-sm text-muted-foreground bg-muted/50">
                  {lockedCompany?.name ?? addAppLockedCompanyId}
                </div>
              </div>
            ) : (
              <div className="relative">
                <Label className="text-sm">选择公司 *</Label>
                <Input
                  className="mt-1"
                  placeholder="搜索公司名称..."
                  value={companySearch !== "" ? companySearch : (appForm.companyId ? (companies.find((c) => c.id === appForm.companyId)?.name ?? "") : "")}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    setAppForm({ ...appForm, companyId: "" });
                    setShowCompanyDrop(true);
                  }}
                  onFocus={() => setShowCompanyDrop(true)}
                  onBlur={() => setTimeout(() => setShowCompanyDrop(false), 150)}
                />
                {showCompanyDrop && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
                    {(companySearch.trim()
                      ? companies.filter((c) => c.name.toLowerCase().includes(companySearch.toLowerCase()))
                      : companies
                    ).map((c) => (
                      <div
                        key={c.id}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setAppForm({ ...appForm, companyId: c.id });
                          setCompanySearch("");
                          setShowCompanyDrop(false);
                        }}
                      >
                        {c.name}
                      </div>
                    ))}
                    {companySearch.trim() && companies.filter((c) => c.name.toLowerCase().includes(companySearch.toLowerCase())).length === 0 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">无匹配公司</div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-sm">岗位名称 *</Label>
              <Input
                className="mt-1"
                value={appForm.positionName}
                onChange={(e) => setAppForm({ ...appForm, positionName: e.target.value })}
                placeholder="例：产品经理实习"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Label className="text-sm">Base 地点</Label>
                <Input
                  className="mt-1"
                  value={appForm.base}
                  onChange={(e) => {
                    setAppForm({ ...appForm, base: e.target.value });
                    setShowBaseDrop(true);
                  }}
                  onFocus={() => setShowBaseDrop(true)}
                  onBlur={() => setTimeout(() => setShowBaseDrop(false), 150)}
                  placeholder="例：北京"
                />
                {showBaseDrop && (
                  <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-md">
                    {(appForm.base.trim()
                      ? ["北京", "上海", "深圳", "广州", "香港", "杭州", "南京"].filter((c) => c.includes(appForm.base))
                      : ["北京", "上海", "深圳", "广州", "香港", "杭州", "南京"]
                    ).map((city) => (
                      <div
                        key={city}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setAppForm({ ...appForm, base: city });
                          setShowBaseDrop(false);
                        }}
                      >
                        {city}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-sm">当前进度</Label>
                <Select
                  value={appForm.status}
                  onValueChange={(v) => setAppForm({ ...appForm, status: v ?? "已投递" })}
                >
                  <SelectTrigger className="mt-1">
                    <span>{appForm.status}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {APPLICATION_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-sm">JD 链接</Label>
              <Input
                className="mt-1"
                value={appForm.jdLink}
                onChange={(e) => setAppForm({ ...appForm, jdLink: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label className="text-sm">备注</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={appForm.notes}
                onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddAppOpen(false)}>取消</Button>
              <Button
                onClick={submitAddApp}
                disabled={!appForm.companyId || !appForm.positionName.trim()}
              >
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 添加安排弹窗 */}
      <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>添加面试/笔试安排</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">类型</Label>
              <Select
                value={eventForm.type}
                onValueChange={(v) => setEventForm({ ...eventForm, type: v ?? "interview" })}
              >
                <SelectTrigger className="mt-1">
                  <span>{EVENT_TYPE_LABELS[eventForm.type] ?? eventForm.type}</span>
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_TYPE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">时间</Label>
              <Input
                className="mt-1"
                type="datetime-local"
                value={eventForm.scheduledAt}
                onChange={(e) => setEventForm({ ...eventForm, scheduledAt: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm">链接（可选）</Label>
              <Input
                className="mt-1"
                value={eventForm.link}
                onChange={(e) => setEventForm({ ...eventForm, link: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <Label className="text-sm">备注（可选）</Label>
              <Textarea
                className="mt-1"
                rows={2}
                value={eventForm.notes}
                onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddEventOpen(false)}>取消</Button>
              <Button onClick={addEvent}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建周期弹窗 */}
      <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>新建求职周期</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">周期名称</Label>
              <Input
                className="mt-1"
                value={newCycleName}
                onChange={(e) => setNewCycleName(e.target.value)}
                placeholder="例：2026秋招"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCycleDialogOpen(false)}>取消</Button>
              <Button onClick={createCycle} disabled={!newCycleName}>创建</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 已挂：选择挂在哪个节点 */}
      <Dialog open={failNodeDialogOpen} onOpenChange={(open) => { if (!open) { setFailNodeDialogOpen(false); setPendingFailAppId(null); } }}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>在哪个节点挂的？</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedFailNode} onValueChange={(v) => { if (v) setSelectedFailNode(v); }}>
              <SelectTrigger>
                <span>{selectedFailNode}</span>
              </SelectTrigger>
              <SelectContent>
                {FAIL_NODE_LABELS.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => { setFailNodeDialogOpen(false); setPendingFailAppId(null); }}>取消</Button>
              <Button onClick={confirmFail}>确认</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
