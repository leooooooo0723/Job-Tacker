"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

interface Cycle {
  id: string;
  name: string;
  isActive: boolean;
}

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
}

const ALL_SENTINEL = "__all__";

export default function CycleSelector({ value, onChange }: Props) {
  const [cycles, setCycles] = useState<Cycle[]>([]);

  useEffect(() => {
    apiFetch("/api/cycles")
      .then((r) => r.json())
      .then((data: Cycle[]) => {
        setCycles(data);
        if (!value) {
          const active = data.find((c) => c.isActive);
          if (active) onChange(active.id);
        }
      });
  }, []);

  const selectValue = value ?? ALL_SENTINEL;

  function getLabel() {
    if (!value) return "全部周期";
    const cycle = cycles.find((c) => c.id === value);
    if (!cycle) return "选择周期";
    return `${cycle.name}${cycle.isActive ? " ★" : ""}`;
  }

  return (
    <Select
      value={selectValue}
      onValueChange={(v) => {
        if (!v) return;
        onChange(v === ALL_SENTINEL ? null : v);
      }}
    >
      <SelectTrigger className="w-44 text-sm">
        <span className={!value ? "text-muted-foreground" : ""}>{getLabel()}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_SENTINEL}>全部周期</SelectItem>
        {cycles.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}{c.isActive ? " ★" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
