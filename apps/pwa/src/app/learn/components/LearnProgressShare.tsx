"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useQueryClient } from "@tanstack/react-query";
import { EXAM_PICKER_ENTRIES, type ExamTargetId } from "@i-am-smart/shared/constants";
import { Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  fetchExamVocabProgress,
  type ExamVocabProgressItem,
} from "@/lib/api/examVocabProgress";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { resolveShareLandingUrl } from "../lib/shareLandingUrl";

const CARD_PX = 360;
/** Outer card radius; keep in sync with preview <img> rounding (e.g. rounded-2xl). */
const CARD_RADIUS_PX = 16;
const BRAND_FALLBACK = "聪明的背单词工具";

function getBrandLine(): string {
  return process.env.NEXT_PUBLIC_SHARE_CARD_BRAND?.trim() || BRAND_FALLBACK;
}

/** Short learning-themed mottos / famous lines; one is chosen per share image. */
const LEARNING_QUOTES = [
  { text: "学而不思则罔，思而不学则殆。", attribution: "《论语·为政》" },
  { text: "温故而知新，可以为师矣。", attribution: "《论语》" },
  { text: "学而时习之，不亦说乎。", attribution: "《论语》" },
  { text: "不积跬步，无以至千里；不积小流，无以成江海。", attribution: "《荀子·劝学》" },
  { text: "锲而不舍，金石可镂。", attribution: "《荀子·劝学》" },
  { text: "书山有路勤为径，学海无涯苦作舟。", attribution: "韩愈" },
  { text: "业精于勤，荒于嬉；行成于思，毁于随。", attribution: "韩愈《进学解》" },
  { text: "读书破万卷，下笔如有神。", attribution: "杜甫" },
  { text: "问渠那得清如许？为有源头活水来。", attribution: "朱熹" },
  { text: "旧书不厌百回读，熟读深思子自知。", attribution: "苏轼" },
  { text: "纸上得来终觉浅，绝知此事要躬行。", attribution: "陆游" },
  { text: "千里之行，始于足下。", attribution: "《道德经》" },
] as const;

function pickLearningQuote(): { text: string; attribution: string } {
  const i = Math.floor(Math.random() * LEARNING_QUOTES.length);
  return LEARNING_QUOTES[i]!;
}

/** Same mapping as settings `shareExamMeta`: current exam → canonical row in API list. */
function resolveShareSnapshot(
  items: ExamVocabProgressItem[],
  currentExamTarget: string
): { examLabel: string; brushed: number; total: number } {
  const entry = EXAM_PICKER_ENTRIES.find((e) =>
    e.examTargetIds.includes(currentExamTarget as ExamTargetId)
  );
  const canonical = entry?.canonicalExamTargetId ?? "ket";
  const row = items.find((p) => p.examId === canonical);
  return {
    examLabel: entry?.label ?? currentExamTarget,
    brushed: row?.brushed ?? 0,
    total: row?.total ?? 0,
  };
}

interface LearnProgressShareCardProps {
  quoteText: string;
  quoteAttribution: string;
  examLabel: string;
  brushed: number;
  total: number;
  qrDataUrl: string | null;
}

const LearnProgressShareCard = forwardRef<HTMLDivElement, LearnProgressShareCardProps>(
  function LearnProgressShareCard(
    { quoteText, quoteAttribution, examLabel, brushed, total, qrDataUrl },
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
          borderRadius: CARD_RADIUS_PX,
          overflow: "hidden",
          backgroundColor: "#f4f4f5",
          // box-shadow avoids border+radius rasterization glitches in WebKit / html-to-image
          boxShadow: "0 0 0 1px #e4e4e7",
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
            margin: "12px 0 0",
            fontSize: 22,
            fontWeight: 800,
            lineHeight: 1.2,
            textAlign: "center",
          }}
        >
          我的学习进度
        </h2>
        <div
          style={{
            marginTop: 12,
            paddingLeft: 11,
            borderLeft: "3px solid #d4d4d8",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#3f3f46",
              lineHeight: 1.55,
              fontStyle: "italic",
            }}
          >
            {quoteText}
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 11,
              color: "#a1a1aa",
              lineHeight: 1.35,
              textAlign: "right",
            }}
          >
            — {quoteAttribution}
          </p>
        </div>
        <p
          style={{
            margin: "12px 0 0",
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
            borderRadius: 10,
            backgroundColor: "#fff",
            boxShadow: "0 0 0 1px #e4e4e7",
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
              boxShadow: "0 0 0 1px #e4e4e7",
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
  /** Required to fetch fresh词库进度 on share tap (before generating the image). */
  profileId: string | undefined;
  currentExamTarget: string;
  disabled?: boolean;
}

type SharePhase = "idle" | "fetching" | "capturing";

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
  profileId,
  currentExamTarget,
  disabled = false,
}: LearnProgressShareProps) {
  const queryClient = useQueryClient();
  const cardRef = useRef<HTMLDivElement>(null);
  const shareInFlight = useRef(false);
  const [sharePhase, setSharePhase] = useState<SharePhase>("idle");
  const [exportPayload, setExportPayload] = useState<{
    quoteText: string;
    quoteAttribution: string;
    examLabel: string;
    brushed: number;
    total: number;
    qrDataUrl: string;
  } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const closePreview = useCallback(() => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  const handleShare = useCallback(async () => {
    if (disabled || shareInFlight.current) return;
    if (!profileId) {
      toast.error("请先选择学习档案");
      return;
    }
    shareInFlight.current = true;
    setSharePhase("fetching");
    try {
      const items = await fetchExamVocabProgress(profileId);
      queryClient.setQueryData(["exam-vocab-progress", profileId], items);
      const { examLabel, brushed, total } = resolveShareSnapshot(items, currentExamTarget);

      setSharePhase("capturing");
      // Load capture libs only after progress is known (user already tapped share).
      const [{ toPng }, QRMod] = await Promise.all([
        import("html-to-image"),
        import("qrcode"),
      ]);
      const QRCode = QRMod.default;

      const landing = `${resolveShareLandingUrl()}/`;
      const qr = await QRCode.toDataURL(landing, {
        width: 160,
        margin: 1,
        color: { dark: "#18181b", light: "#ffffff" },
      });
      const { text: quoteText, attribution: quoteAttribution } = pickLearningQuote();
      flushSync(() => {
        setExportPayload({
          quoteText,
          quoteAttribution,
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
      shareInFlight.current = false;
      setSharePhase("idle");
    }
  }, [profileId, currentExamTarget, disabled, queryClient]);

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

  const busy = sharePhase !== "idle" || disabled || !profileId;
  const phaseLabel =
    sharePhase === "fetching"
      ? "正在获取进度…"
      : sharePhase === "capturing"
        ? "正在生成图片…"
        : "分享学习进度";

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
            quoteText={exportPayload.quoteText}
            quoteAttribution={exportPayload.quoteAttribution}
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
        aria-label={
          sharePhase === "idle" ? "分享学习进度图片" : "正在准备分享图片"
        }
      >
        {sharePhase !== "idle" ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <Share2 className="h-5 w-5 shrink-0" aria-hidden />
        )}
        <span className="flex-1 font-medium">{phaseLabel}</span>
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
            className="max-h-[min(78vh,720px)] w-auto max-w-full rounded-2xl shadow-2xl"
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
