import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, FileText, Trash2, Eye, Download, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

interface Resume {
  id: string;
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function extLabel(mimeType: string) {
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType === "application/msword") return "DOC";
  return "DOCX";
}

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [previewResume, setPreviewResume] = useState<Resume | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const load = () =>
    apiFetch("/api/resumes")
      .then((r) => r.json())
      .then(setResumes);

  useEffect(() => { load(); }, []);

  function openUpload() {
    setName("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setUploadOpen(true);
  }

  async function upload() {
    if (!name.trim()) { toast.error("请填写简历名称"); return; }
    if (!file) { toast.error("请选择文件"); return; }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      fd.append("file", file);

      const res = await apiFetch("/api/resumes", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "上传失败");
        return;
      }
      toast.success("简历已上传");
      setUploadOpen(false);
      load();
    } catch {
      toast.error("上传失败，请检查网络连接");
    } finally {
      setUploading(false);
    }
  }

  async function remove(resume: Resume) {
    if (!confirm(`确认删除「${resume.name}」？`)) return;
    const res = await apiFetch(`/api/resumes/${resume.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("已删除");
      load();
    } else {
      toast.error("删除失败");
    }
  }

  async function downloadResume(resume: Resume) {
    const res = await apiFetch(`/api/resumes/${resume.id}`);
    if (!res.ok) { toast.error("下载失败"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resume.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function openPreview(resume: Resume) {
    setPreviewResume(resume);
    setPreviewUrl(null);
    if (resume.mimeType === "application/pdf") {
      const res = await apiFetch(`/api/resumes/${resume.id}`);
      if (res.ok) {
        const blob = await res.blob();
        setPreviewUrl(URL.createObjectURL(blob));
      }
    }
  }

  function closePreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewResume(null);
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">简历管理</h2>
        <div className="flex items-center gap-2">
          <a href="https://www.wondercv.com/cvs" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink size={14} className="mr-1" />
              WonderCV 编辑简历
            </Button>
          </a>
          <Button size="sm" onClick={openUpload}>
            <Plus size={14} className="mr-1" />
            上传简历
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-400">{resumes.length} 份简历 · 支持 PDF / DOC / DOCX，单文件最大 10MB</p>

      {/* 列表 */}
      <div className="grid gap-3">
        {resumes.map((r) => (
          <Card key={r.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="px-4 py-3 flex items-center gap-3">
              <FileText size={28} className="text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{r.name}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {extLabel(r.mimeType)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatSize(r.size)} · 上传于 {formatDate(r.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => openPreview(r)}
                  title="预览"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={() => downloadResume(r)}
                  title="下载"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => remove(r)}
                  title="删除"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        {resumes.length === 0 && (
          <p className="text-sm text-gray-400 py-12 text-center">
            暂无简历，点击右上角上传
          </p>
        )}
      </div>

      {/* 上传弹窗 */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>上传简历</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">简历名称</Label>
              <Input
                className="mt-1"
                placeholder="例：产品经理、后端开发"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-sm">选择文件</Label>
              <Input
                ref={fileRef}
                className="mt-1"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file && (
                <p className="text-xs text-gray-400 mt-1">
                  {file.name} · {formatSize(file.size)}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setUploadOpen(false)}>
                取消
              </Button>
              <Button onClick={upload} disabled={uploading}>
                {uploading ? "上传中…" : "上传"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 预览弹窗 */}
      <Dialog open={!!previewResume} onOpenChange={(o) => !o && closePreview()}>
        <DialogContent className="max-w-[92vw] w-full h-[90vh] flex flex-col">
          {previewResume && (
            <>
              <DialogHeader className="shrink-0">
                <DialogTitle className="flex items-center gap-2">
                  {previewResume.name}
                  <Badge variant="secondary" className="text-xs">
                    {extLabel(previewResume.mimeType)}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              {previewResume.mimeType === "application/pdf" ? (
                previewUrl ? (
                  <iframe
                    src={previewUrl}
                    className="flex-1 w-full rounded border"
                    title={previewResume.name}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
                    加载中…
                  </div>
                )
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                  <FileText size={48} className="text-gray-300" />
                  <p className="text-sm text-gray-500">
                    {extLabel(previewResume.mimeType)} 格式暂不支持在线预览，请下载后查看
                  </p>
                  <Button onClick={() => downloadResume(previewResume)}>
                    <Download size={14} className="mr-1" />
                    下载文件
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
