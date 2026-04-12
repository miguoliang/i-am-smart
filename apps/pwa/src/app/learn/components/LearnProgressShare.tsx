"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { resolveShareLandingUrl } from "../lib/shareLandingUrl";

const CARD_PX = 360;
const BRAND_FALLBACK = "聪明的背单词工具";

function getBrandLine(): string {
  return process.env.NEXT_PUBLIC_SHARE_CARD_BRAND?.trim() || BRAND_FALLBACK;
}

interface LearnProgressShareCardProps {
  profileName: string;
  examLabel: string;
  brushed: number;
  total: number;
  qrDataUrl: string | null;
}

const LearnProgressShareCard = forwardRef<HTMLDivElement, LearnProgressShareCardProps>(
  function LearnProgressShareCard(
    { profileName, examLabel, brushed, total, qrDataUrl },
    ref
  ) {
    const pct =
      total > 0 ? Math.min(100, Math.round((brushed / total) * 100)) : null;

    return (
      <div
        ref={ref}
        style={{
          width: CARD_PX,
          boxSizing: "border-box",
          padding: "28px 24px 24px",
          borderRadius: 20,
          backgroundColor: "#f4f4f5",
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
        <h2
          style={{
            margin: "14px 0 0",
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          我的学习进度
        </h2>
        <p
          style={{
            margin: "14px 0 0",
            fontSize: 14,
            color: "#52525b",
            lineHeight: 1.45,
          }}
        >
          <span style={{ color: "#71717a" }}>学习档案</span>{" "}
          <span style={{ fontWeight: 600, color: "#18181b" }}>{profileName}</span>
        </p>
        <p
          style={{
            margin: "8px 0 0",
            fontSize: 14,
            color: "#52525b",
            lineHeight: 1.45,
          }}
        >
          <span style={{ color: "#71717a" }}>当前词库</span>{" "}
          <span style={{ fontWeight: 600, color: "#18181b" }}>{examLabel}</span>
        </p>
        <div
          style={{
            marginTop: 18,
            padding: "16px 14px",
            borderRadius: 12,
            backgroundColor: "#fff",
            border: "1px solid #e4e4e7",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 13, color: "#71717a" }}>词库进度</p>
          <p
            style={{
              margin: "8px 0 0",
              fontSize: 28,
              fontWeight: 800,
              color: "#2563eb",
              letterSpacing: "-0.02em",
            }}
          >
            {brushed} / {total}
          </p>
          {pct !== null ? (
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#52525b" }}>
              约 {pct}% 已覆盖
            </p>
          ) : (
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#a1a1aa" }}>
              暂无词库数据
            </p>
          )}
        </div>

        <div
          style={{
            marginTop: 20,
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
            <p
              style={{ margin: "4px 0 0", fontSize: 11, color: "#71717a", lineHeight: 1.35 }}
            >
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
);

LearnProgressShareCard.displayName = "LearnProgressShareCard";

export interface LearnProgressShareProps {
  profileName: string;
  examLabel: string;
  brushed: number;
  total: number;
  progressLoading: boolean;
  disabled?: boolean;
}

async function waitForImagesInNode(node: HTMLElement): Promise<void> {
  const imgs = node.querySelectorAll("img");
  await Promise.all(
    [...imgs].map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.addEventListener("load", () => resolve(), { once: true });
          img.addEventListener("error", () => resolve(), { once: true });
        })
    )
  );
}

export function LearnProgressShare({
  profileName,
  examLabel,
  brushed,
  total,
  progressLoading,
  disabled = false,
}: LearnProgressShareProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exportPayload, setExportPayload] = useState<{
    profileName: string;
    examLabel: string;
    brushed: number;
    total: number;
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
    if (isGenerating || progressLoading || disabled) return;
    setIsGenerating(true);
    try {
      const landing = `${resolveShareLandingUrl()}/`;
      const qr = await QRCode.toDataURL(landing, {
        width: 160,
        margin: 1,
        color: { dark: "#18181b", light: "#ffffff" },
      });
      flushSync(() => {
        setExportPayload({
          profileName,
          examLabel,
          brushed,
          total,
          qrDataUrl: qr,
        });
      });
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      await new Promise<void>((r) => setTimeout(r, 32));
      if (typeof document !== "undefined" && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          /* ignore */
        }
      }
      const node = cardRef.current;
      if (!node) {
        throw new Error("分享卡片未就绪");
      }
      await waitForImagesInNode(node);
      const height = Math.ceil(node.getBoundingClientRect().height);
      const dataUrl = await toPng(node, {
        width: CARD_PX,
        height: height > 0 ? height : undefined,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#f4f4f5",
        style: {
          transform: "none",
          position: "static",
          left: "auto",
          top: "auto",
        },
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
  }, [
    isGenerating,
    progressLoading,
    disabled,
    profileName,
    examLabel,
    brushed,
    total,
  ]);

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

  const busy = progressLoading || isGenerating;

  return (
    <>
      {exportPayload ? (
        <div
          className="pointer-events-none fixed z-[5] max-h-none max-w-none overflow-visible"
          style={{
            left: -10000,
            top: 0,
            width: CARD_PX,
            opacity: 1,
          }}
          aria-hidden
        >
          <LearnProgressShareCard
            ref={cardRef}
            profileName={exportPayload.profileName}
            examLabel={exportPayload.examLabel}
            brushed={exportPayload.brushed}
            total={exportPayload.total}
            qrDataUrl={exportPayload.qrDataUrl}
          />
        </div>
      ) : null}

      <button
        type="button"
        onClick={handleShare}
        disabled={busy || disabled}
        className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        aria-label="分享学习进度图片"
      >
        <Share2 className="h-5 w-5 shrink-0" aria-hidden />
        <span className="flex-1 font-medium">
          {progressLoading ? "加载进度…" : "分享学习进度"}
        </span>
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
            download="学习进度分享.png"
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
