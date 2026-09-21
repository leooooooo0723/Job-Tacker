import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ExternalLink, CalendarDays, TrendingUp } from "lucide-react";
import CycleSelector from "@/components/CycleSelector";
import { APPLICATION_STATUSES } from "@/lib/constants";
import { apiFetch } from "@/lib/api";

interface StatusDetail {
  companyName: string;
  positionName: string;
  failNode: string | null;
}

interface DashboardData {
  todayEvents: TodayEvent[];
  total: number;
  byStatus: Record<string, number>;
  byStatusDetails: Record<string, StatusDetail[]>;
}

interface TodayEvent {
  id: string;
  type: string;
  scheduledAt: string;
  link: string;
  notes: string;
  application: { company: { name: string } };
}

const TYPE_LABELS: Record<string, string> = {
  interview: "面试",
  written_test: "笔试",
  assessment: "测评",
};

const PIE_COLORS = ["#3b82f6", "#06b6d4", "#6366f1", "#0ea5e9", "#38bdf8", "#818cf8", "#34d399", "#f59e0b"];

// 保持状态统计卡片按既定顺序显示
const STATUS_ORDER = APPLICATION_STATUSES as readonly string[];

export default function DashboardPage() {
  const [cycleId, setCycleId] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [tooltip, setTooltip] = useState<{ status: string; x: number; y: number } | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);

  useEffect(() => {
    const url = cycleId ? `/api/dashboard?cycleId=${cycleId}` : "/api/dashboard";
    apiFetch(url).then((r) => r.json()).then(setData);
  }, [cycleId]);

  const statusChartData = data
    ? Object.entries(data.byStatus).map(([k, v]) => ({ name: k, value: v }))
    : [];

  // 按预设顺序排列统计卡片
  const statusCards = data
    ? STATUS_ORDER.filter((s) => s in data.byStatus).map((s) => ({ status: s, count: data.byStatus[s] }))
    : [];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">今日概览</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {format(new Date(), "yyyy年MM月dd日 EEEE", { locale: zhCN })}
          </p>
        </div>
        <CycleSelector value={cycleId} onChange={setCycleId} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarDays size={16} />
            今日安排
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data || data.todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">今日暂无安排</p>
          ) : (
            <div className="space-y-2">
              {data.todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-muted-foreground w-12">
                      {format(new Date(event.scheduledAt), "HH:mm")}
                    </span>
                    <span className="text-sm font-medium">
                      {event.application.company.name}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {TYPE_LABELS[event.type] ?? event.type}
                    </Badge>
                  </div>
                  {event.link && (
                    <a
                      href={event.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
                    >
                      <ExternalLink size={12} />
                      进入
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            if (pinned === "__total__") { setPinned(null); setTooltip(null); return; }
            setPinned("__total__");
            setTooltip({ status: "__total__", x: rect.left, y: rect.bottom });
          }}
          onMouseEnter={(e) => {
            if (pinned) return;
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            setTooltip({ status: "__total__", x: rect.left, y: rect.bottom });
          }}
          onMouseLeave={() => { if (!pinned) setTooltip(null); }}
        >
          <Card className={`py-3 cursor-pointer ${pinned === "__total__" ? "ring-2 ring-primary" : ""}`}>
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">总投递</p>
              <p className="text-2xl font-semibold mt-1">{data?.total ?? 0}</p>
            </CardContent>
          </Card>
        </div>
        {statusCards.map(({ status, count }) => {
          const isFailStatus = status === "已挂";
          return (
            <div
              key={status}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                if (pinned === status) { setPinned(null); setTooltip(null); return; }
                setPinned(status);
                setTooltip({ status, x: rect.left, y: rect.bottom });
              }}
              onMouseEnter={(e) => {
                if (pinned) return;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                setTooltip({ status, x: rect.left, y: rect.bottom });
              }}
              onMouseLeave={() => { if (!pinned) setTooltip(null); }}
            >
              <Card className={`py-3 cursor-pointer ${pinned === status ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="px-4">
                  <p className={`text-xs ${isFailStatus ? "text-red-500" : "text-muted-foreground"}`}>{status}</p>
                  <p className={`text-2xl font-semibold mt-1 ${isFailStatus ? "text-red-600" : ""}`}>{count}</p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>

      {/* 状态悬浮详情 — fixed 定位，脱离所有 overflow 限制 */}
      {tooltip && (() => {
        const isTotal = tooltip.status === "__total__";
        const details: (StatusDetail & { status?: string })[] = isTotal
          ? Object.entries(data?.byStatusDetails ?? {}).flatMap(([s, arr]) =>
              arr.map((d) => ({ ...d, status: s }))
            )
          : (data?.byStatusDetails?.[tooltip.status] ?? []);
        const label = isTotal ? "总投递" : tooltip.status;
        const count = isTotal ? (data?.total ?? 0) : (data?.byStatus?.[tooltip.status] ?? 0);
        if (details.length === 0) return null;
        return (
          <>
            {pinned && (
              <div
                className="fixed inset-0 z-[9998]"
                onClick={() => { setPinned(null); setTooltip(null); }}
              />
            )}
            <div
              style={{ position: "fixed", left: tooltip.x, top: tooltip.y + 6, zIndex: 9999 }}
              className="w-60 bg-white border border-gray-200 rounded-md shadow-xl py-1.5"
              onMouseLeave={() => { if (!pinned) setTooltip(null); }}
            >
            <p className="text-xs font-medium text-gray-500 px-3 pb-1 border-b border-gray-100 mb-1">
              {label} · {count} 条
            </p>
            <ul className="max-h-60 overflow-y-auto">
              {details.map((d, i) => {
                const isFail = (d.status ?? tooltip.status) === "已挂";
                return (
                  <li key={i} className="px-3 py-1.5 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium leading-tight text-gray-800 truncate">{d.companyName}</p>
                      {isTotal && d.status && (
                        <span className={`text-[10px] shrink-0 px-1 rounded ${isFail ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500"}`}>{d.status}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-tight mt-0.5">
                      {d.positionName || "未填写岗位"}
                      {isFail && d.failNode && (
                        <span className="ml-1.5 text-red-500">· 挂/{d.failNode}</span>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
          </>
        );
      })()}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp size={16} />
            投递状态分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statusChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">暂无数据</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
