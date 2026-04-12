"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import type { Knowledge } from "../types";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { resolveShareLandingUrl } from "../lib/shareLandingUrl";

const CARD_PX = 360;
const BRAND_FALLBACK = "聪明的背单词工具";

function getBrandLine(): string {
  return process.env.NEXT_PUBLIC_SHARE_CARD_BRAND?.trim() || BRAND_FALLBACK;
}

interface LearnMomentShareCardProps {
  knowledge: Knowledge;
  qrDataUrl: string | null;
}

/**
 * Fixed-size DOM for PNG export (positioned off-screen). Uses inline styles so
 * html-to-image captures reliably without relying on Tailwind in hidden trees.
 */
function LearnMomentShareCard({ knowledge, qrDataUrl }: LearnMomentShareCardProps) {
  const example =
    knowledge.exampleSentence.length > 96
      ? `${knowledge.exampleSentence.slice(0, 96)}…`
      : knowledge.exampleSentence;

  return (
    <div
      style={{
        width: CARD_PX,
        boxSizing: "border-box",
        padding: "28px 24px 24px",
        borderRadius: 20,
        background: "linear-gradient(165deg, #fafafa 0%, #f4f4f5 100%)",
        border: "1px solid #e4e4e7",
        fontFamily:
          'system-ui, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        color: "#18181b",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#71717a",
        }}
      >
        {getBrandLine()}
      </p>
      <p style={{ margin: "16px 0 0", fontSize: 13, color: "#71717a" }}>
        {knowledge.level} · {knowledge.pos}
      </p>
      <h2
        style={{
          margin: "12px 0 0",
          fontSize: 36,
          fontWeight: 800,
          lineHeight: 1.15,
          textAlign: "center",
          wordBreak: "break-word",
        }}
      >
        {knowledge.name}
      </h2>
      <p
        style={{
          margin: "16px 0 0",
          fontSize: 22,
          fontWeight: 700,
          textAlign: "center",
          color: "#2563eb",
          wordBreak: "break-word",
          lineHeight: 1.35,
        }}
      >
        {knowledge.description}
      </p>
      {example ? (
        <p
          style={{
            margin: "18px 0 0",
            fontSize: 13,
            lineHeight: 1.45,
            color: "#52525b",
            fontStyle: "italic",
          }}
        >
          {example}
        </p>
      ) : null}

      <div
        style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: "1px solid #e4e4e7",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#3f3f46" }}>
            扫码一起学习
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#71717a", lineHeight: 1.35 }}>
            保存图片到相册，即可发朋友圈
          </p>
        </div>
        <div
          style={{
            width: 88,
            height: 88,
            flexShrink: 0,
            background: "#fff",
            borderRadius: 8,
            border: "1px solid #e4e4e7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL from QRCode.toDataURL
            <img src={qrDataUrl} alt="" width={80} height={80} />
          ) : (
            <span style={{ fontSize: 10, color: "#a1a1aa" }}>…</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface LearnMomentShareProps {
  knowledge: Knowledge;
}

export function LearnMomentShare({ knowledge }: LearnMomentShareProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  /** Only mounted while generating PNG so learn page tests / DOM do not duplicate word content. */
  const [exportPayload, setExportPayload] = useState<{
    knowledge: Knowledge;
    qrDataUrl: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const closePreview = useCallback(() => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleShare = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const landing = `${resolveShareLandingUrl()}/`;
      const qr = await QRCode.toDataURL(landing, {
        width: 160,
        margin: 1,
        color: { dark: "#18181b", light: "#ffffff" },
      });
      flushSync(() => {
        setExportPayload({ knowledge, qrDataUrl: qr });
      });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const node = cardRef.current;
      if (!node) {
        throw new Error("分享卡片未就绪");
      }
      const dataUrl = await toPng(node, {
        pixelRatio: 3,
        cacheBust: true,
        backgroundColor: "#f4f4f5",
      });
      setExportPayload(null);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl((prev) => {
        if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
        return blobUrl;
      });
      toast.success("已生成图片，长按保存或下载后发朋友圈");
    } catch (e) {
      setExportPayload(null);
      toast.error(getErrorMessage(e));
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, knowledge]);

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!previewUrl) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreview();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewUrl, closePreview]);

  const safeFilenameCode = knowledge.code.replace(/[^\w\-.]/g, "_").slice(0, 48);

  return (
    <>
      {exportPayload ? (
        <div
          ref={cardRef}
          className="pointer-events-none fixed z-0"
          style={{
            left: 0,
            top: 0,
            transform: "translateX(-12000px)",
            opacity: 1,
          }}
          aria-hidden
        >
          <LearnMomentShareCard
            knowledge={exportPayload.knowledge}
            qrDataUrl={exportPayload.qrDataUrl}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleShare}
        disabled={isGenerating}
        className="flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-2xl border bg-card px-6 py-5 text-xl shadow-xl transition hover:bg-muted hover:scale-105 active:scale-95 disabled:opacity-60 md:px-8 md:py-8 md:text-3xl"
        aria-label="生成分享图"
      >
        <Share2 className="h-7 w-7 md:h-9 md:w-9" strokeWidth={1.75} aria-hidden />
        <span className="text-base font-medium md:text-2xl">分享</span>
      </button>

      {previewUrl ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="分享图预览"
          onClick={closePreview}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- user-saved blob preview */}
          <img
            src={previewUrl}
            alt="分享预览"
            className="max-h-[min(78vh,720px)] w-auto max-w-full rounded-lg shadow-2xl"
            onClick={(ev) => ev.stopPropagation()}
          />
          <p className="mt-4 max-w-sm text-center text-sm text-zinc-200">
            长按图片保存到相册，再到微信朋友圈发布。轻触空白处关闭。
          </p>
          <a
            href={previewUrl}
            download={`背单词分享-${safeFilenameCode}.png`}
            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            下载图片
          </a>
        </div>
      ) : null}
    </>
  );
}
