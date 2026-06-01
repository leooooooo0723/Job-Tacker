import { getStatusPipeline } from "@/lib/constants";

export default function StatusPipeline({ status }: { status: string }) {
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
