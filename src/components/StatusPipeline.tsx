import { getStatusPipeline } from "@/lib/constants";

interface Props {
  status: string;
  failNode?: string | null;
}

export default function StatusPipeline({ status, failNode }: Props) {
  if (status === "已挂") {
    const steps = failNode ? getStatusPipelineUpTo(failNode) : [];
    return (
      <div className="flex items-start">
        {steps.map((step, i) => (
          <div key={step.label} className="flex items-start">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-green-500" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap leading-none text-green-600">
                {step.label}
              </span>
            </div>
            <div className="w-3 h-px bg-gray-300 mt-[5px] shrink-0" />
          </div>
        ))}
        <div className="flex flex-col items-center">
          <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-red-500" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap leading-none text-red-500">
            {failNode ? `挂/${failNode}` : "已挂"}
          </span>
        </div>
      </div>
    );
  }

  const steps = getStatusPipeline(status);

  if (steps.length === 0) {
    return <span className="text-xs text-muted-foreground">{status}</span>;
  }

  return (
    <div className="flex items-start">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-start">
          <div className="flex flex-col items-center">
            <div
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                step.state === "done" ? "bg-green-500" : "bg-orange-400"
              }`}
            />
            <span
              className={`text-[10px] mt-0.5 whitespace-nowrap leading-none ${
                step.state === "done" ? "text-green-600" : "text-orange-500"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="w-3 h-px bg-gray-300 mt-[5px] shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

const PIPELINE_STEP_LABELS = [
  "投递", "测评", "笔试", "AI面试", "一面", "二面", "三面", "HR面", "Offer", "签约",
];

function getStatusPipelineUpTo(failNode: string): { label: string }[] {
  const idx = PIPELINE_STEP_LABELS.indexOf(failNode);
  if (idx <= 0) return [];
  return PIPELINE_STEP_LABELS.slice(0, idx).map((label) => ({ label }));
}
