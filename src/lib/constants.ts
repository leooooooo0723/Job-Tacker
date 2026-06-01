export const APPLICATION_STATUSES = [
  "已投递",
  "待测评",
  "已测评",
  "待笔试",
  "已笔试",
  "待AI面试",
  "已AI面试",
  "待一面",
  "已一面",
  "待二面",
  "已二面",
  "待三面",
  "已三面",
  "待HR面",
  "已HR面",
  "offer",
  "三方签约",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function getStatusColor(status: string): string {
  if (status === "offer") return "bg-green-100 text-green-700";
  if (status === "三方签约") return "bg-green-200 text-green-800";
  if (status === "已投递") return "bg-gray-100 text-gray-600";
  if (status.startsWith("待")) return "bg-amber-100 text-amber-700";
  if (status.startsWith("已")) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
}

const PIPELINE_STEPS = [
  { label: "投递", doneStatus: "已投递", pendingStatus: null },
  { label: "测评", doneStatus: "已测评", pendingStatus: "待测评" },
  { label: "笔试", doneStatus: "已笔试", pendingStatus: "待笔试" },
  { label: "AI面试", doneStatus: "已AI面试", pendingStatus: "待AI面试" },
  { label: "一面", doneStatus: "已一面", pendingStatus: "待一面" },
  { label: "二面", doneStatus: "已二面", pendingStatus: "待二面" },
  { label: "三面", doneStatus: "已三面", pendingStatus: "待三面" },
  { label: "HR面", doneStatus: "已HR面", pendingStatus: "待HR面" },
  { label: "Offer", doneStatus: "offer", pendingStatus: null },
  { label: "签约", doneStatus: "三方签约", pendingStatus: null },
];

export type PipelineStepState = "done" | "pending";

export interface PipelineStep {
  label: string;
  state: PipelineStepState;
}

export function getStatusPipeline(status: string): PipelineStep[] {
  const idx = PIPELINE_STEPS.findIndex(
    (s) => s.doneStatus === status || s.pendingStatus === status
  );
  if (idx === -1) return [];

  return PIPELINE_STEPS.slice(0, idx + 1).map((step, i) => ({
    label: step.label,
    state: i < idx || step.doneStatus === status ? "done" : "pending",
  }));
}
