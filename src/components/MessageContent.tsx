interface Props {
  content: string;
}

export default function MessageContent({ content }: Props) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (line.trim() === "") {
      i++;
      continue;
    }

    // 表格：以 | 开头
    if (line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<Table key={i} rows={tableLines} />);
      continue;
    }

    // 有序列表：1. 2. 3.
    if (/^\d+\.\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ""));
        i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-outside pl-5 space-y-1 my-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-gray-700 leading-relaxed">
              <InlineText text={item} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // 无序列表：- 或 •
    if (/^[-–•]\s/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-–•]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-–•]\s/, ""));
        i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-outside pl-5 space-y-1 my-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-gray-700 leading-relaxed">
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // 节标题：**一、...** 或 **标题** 独占一行
    const sectionMatch = line.trim().match(/^\*\*(.+)\*\*$/);
    if (sectionMatch) {
      elements.push(
        <p key={i} className="font-semibold text-gray-800 mt-3 mb-1 text-sm">
          {sectionMatch[1]}
        </p>
      );
      i++;
      continue;
    }

    // 普通段落
    elements.push(
      <p key={i} className="text-gray-700 leading-relaxed">
        <InlineText text={line} />
      </p>
    );
    i++;
  }

  return <div className="space-y-1.5 text-sm">{elements}</div>;
}

// 行内格式：**bold**、✅ 等
function InlineText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const bold = part.match(/^\*\*(.+)\*\*$/);
        if (bold) {
          return <strong key={i} className="font-semibold text-gray-900">{bold[1]}</strong>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// 表格渲染
function Table({ rows }: { rows: string[] }) {
  const parsed = rows.map((r) =>
    r.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1)
  );
  // 找分隔行（全是 --- 的行）
  const sepIdx = parsed.findIndex((row) => row.every((c) => /^-+$/.test(c)));
  const headers = sepIdx > 0 ? parsed[0] : [];
  const bodyRows = sepIdx >= 0 ? parsed.slice(sepIdx + 1) : parsed;

  return (
    <div className="overflow-x-auto my-2 rounded-lg border border-gray-200">
      <table className="w-full text-xs">
        {headers.length > 0 && (
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 text-left font-medium text-gray-600">
                  <InlineText text={h} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-gray-700 border-t border-gray-100">
                  <InlineText text={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
