import { apiFetch } from "@/lib/api";
import { useState, useRef, useEffect } from "react";
import MessageContent from "@/components/MessageContent";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Bot, User, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME: Message = {
  role: "assistant",
  content:
    "你好！我是你的求职助手。你可以问我：\n• 今天有什么面试/笔试安排？\n• 我现在投了多少家？\n• 帮我统计一下求职进度\n• 帮我添加字节跳动明天下午3点的面试\n• 更新某公司的投递状态",
};

const QUICK_PROMPTS = [
  "今天有什么安排？",
  "我现在投了多少家？",
  "帮我统计一下求职进度",
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load persisted history on mount
  useEffect(() => {
    apiFetch("/api/chat")
      .then((r) => r.json())
      .then((data: Message[]) => {
        if (data.length > 0) {
          setMessages(data);
        }
        setHistoryLoaded(true);
      })
      .catch(() => setHistoryLoaded(true));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;

    const optimistic: Message[] = [
      ...messages,
      { role: "user", content: userText },
    ];
    setMessages(optimistic);
    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "请求失败");
        setMessages(messages); // rollback
        return;
      }
      setMessages([...optimistic, { role: "assistant", content: data.text }]);
    } catch {
      toast.error("出错了，请稍后再试");
      setMessages(messages); // rollback
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (!confirm("确认清空全部对话记录？")) return;
    const res = await apiFetch("/api/chat", { method: "DELETE" });
    if (res.ok) {
      setMessages([WELCOME]);
      toast.success("对话已清空");
    }
  }

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">AI 助手</h2>
          <p className="text-xs text-gray-400 mt-0.5">用自然语言查询和管理求职进度</p>
        </div>
        {historyLoaded && messages.length > 1 && (
          <button
            onClick={clearHistory}
            title="清空对话"
            className="text-gray-400 hover:text-red-500 transition-colors mt-1"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "assistant"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-gray-200 text-gray-600"
              }`}
            >
              {msg.role === "assistant" ? <Bot size={14} /> : <User size={14} />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                msg.role === "assistant"
                  ? "bg-white border border-gray-200 text-gray-800"
                  : "bg-blue-600 text-white whitespace-pre-wrap"
              }`}
            >
              {msg.role === "assistant"
                ? <MessageContent content={msg.content} />
                : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Bot size={14} />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm text-gray-400">
              思考中...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-6 py-2 flex gap-2 flex-wrap">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            onClick={() => send(p)}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-gray-200 bg-white">
        <div className="flex gap-2 items-end">
          <Textarea
            className="resize-none text-sm min-h-[44px] max-h-32"
            rows={1}
            placeholder="输入问题或指令..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            size="sm"
            className="shrink-0 h-9"
            onClick={() => send()}
            disabled={!input.trim() || loading}
          >
            <Send size={14} />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">Enter 发送，Shift+Enter 换行</p>
      </div>
    </div>
  );
}
