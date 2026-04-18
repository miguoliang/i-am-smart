"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/form/Button";
import { Textarea } from "@/components/form/Textarea";
import { Label } from "@/components/form/Label";
import { Input } from "@/components/form/Input";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";
import { MAX_CONTACT_BODY, MAX_CONTACT_HINT } from "@/lib/validation/contactMessage";
import { createClient } from "@/lib/supabaseClient";
import { uploadContactAttachmentFromBrowser } from "@/lib/contact-attachments/uploadFromBrowser";
import {
  MAX_CONTACT_ATTACHMENT_BYTES,
  MAX_CONTACT_ATTACHMENTS_PER_MESSAGE,
  isAllowedContactAttachmentMime,
} from "@/lib/contact-attachments/config";

export default function ContactPage() {
  const [body, setBody] = useState("");
  const [contactHint, setContactHint] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewUrls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previewUrls]);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next = [...files];
    for (let i = 0; i < list.length; i++) {
      if (next.length >= MAX_CONTACT_ATTACHMENTS_PER_MESSAGE) {
        toast.error(`最多添加 ${MAX_CONTACT_ATTACHMENTS_PER_MESSAGE} 个附件`);
        break;
      }
      const f = list[i];
      if (f.size > MAX_CONTACT_ATTACHMENT_BYTES) {
        toast.error("单个附件不能超过 5 MB");
        continue;
      }
      const mime = f.type.trim();
      if (!mime || !isAllowedContactAttachmentMime(mime)) {
        toast.error("仅支持常见图片或视频格式");
        continue;
      }
      next.push(f);
    }
    setFiles(next);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("请先登录");
        return;
      }

      const attachments: { path: string; mime_type: string; size_bytes: number }[] = [];
      for (let i = 0; i < files.length; i++) {
        attachments.push(await uploadContactAttachmentFromBrowser(files[i], user.id));
      }

      const response = await fetch("/api/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          contact_hint: contactHint.trim() || undefined,
          attachments,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const errorMessage = data.error?.message || "提交失败，请稍后重试";
        toast.error(errorMessage);
        logger.error("Contact message submission failed", { data });
        return;
      }
      toast.success(data.data?.message || "留言已提交，我们会尽快查看。");
      setBody("");
      setContactHint("");
      setFiles([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "提交失败，请检查网络连接";
      toast.error(errorMessage);
      logger.error("Contact message submission exception", { error: err, message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col pb-24">
      <div className="flex-1 max-w-2xl w-full mx-auto p-5 md:p-8 lg:p-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
          联系开发者
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 md:mb-8">
          使用中遇到问题、闪退、数据异常等，请在此留言说明。可上传截图或录屏（每个文件不超过 5 MB，最多{" "}
          {MAX_CONTACT_ATTACHMENTS_PER_MESSAGE} 个）。如需回复，可留下微信号或邮箱（选填）。
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" aria-label="联系开发者表单">
          <div className="space-y-2">
            <Label htmlFor="contact-body" className="text-base font-semibold">
              问题描述 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Textarea
              id="contact-body"
              name="body"
              required
              minLength={10}
              maxLength={MAX_CONTACT_BODY}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="请尽量写清：出现问题的页面或操作步骤、是否有报错提示等"
              className="min-h-[160px] resize-y"
              aria-describedby="contact-body-hint"
            />
            <p id="contact-body-hint" className="text-sm text-gray-500 dark:text-gray-400">
              至少 10 字，最多 {MAX_CONTACT_BODY} 字 · {body.trim().length}/{MAX_CONTACT_BODY}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-files" className="text-base font-semibold">
              附件（选填）
            </Label>
            <input
              ref={fileInputRef}
              id="contact-files"
              type="file"
              accept="image/*,video/*"
              multiple
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-2"
              onChange={(e) => addFiles(e.target.files)}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              图片或视频，单个 ≤ 5 MB，最多 {MAX_CONTACT_ATTACHMENTS_PER_MESSAGE} 个
            </p>
            {files.length > 0 && (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {files.map((file, index) => (
                  <li
                    key={`${file.name}-${file.size}-${index}`}
                    className="relative rounded-md border border-border overflow-hidden bg-muted/40"
                  >
                    {file.type.startsWith("video/") ? (
                      <video
                        src={previewUrls[index]}
                        className="w-full h-28 object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element -- local blob preview
                      <img
                        src={previewUrls[index]}
                        alt=""
                        className="w-full h-28 object-cover"
                      />
                    )}
                    <button
                      type="button"
                      className="absolute top-1 right-1 rounded bg-background/90 px-2 py-0.5 text-xs"
                      onClick={() => removeFile(index)}
                    >
                      移除
                    </button>
                    <p className="truncate px-1 py-1 text-xs text-muted-foreground" title={file.name}>
                      {file.name}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact-hint" className="text-base font-semibold">
              联系方式（选填）
            </Label>
            <Input
              id="contact-hint"
              name="contact_hint"
              type="text"
              maxLength={MAX_CONTACT_HINT}
              value={contactHint}
              onChange={(e) => setContactHint(e.target.value)}
              placeholder="微信号、邮箱或手机号，方便我们回复你"
              autoComplete="email"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              不超过 {MAX_CONTACT_HINT} 字
            </p>
          </div>

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full py-3.5 md:py-4 min-h-[48px] touch-manipulation"
          >
            提交留言
          </Button>
        </form>
      </div>
    </div>
  );
}
