"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/form/Button";
import { Share2, Copy, Check } from "lucide-react";

export function InviteCard() {
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, converted: 0 });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) {
          setCode(res.data.code);
          setStats({ total: res.data.total, converted: res.data.converted });
        }
      })
      .catch(() => {});
  }, []);

  if (!code) return null;

  const shareUrl = `${window.location.origin}/learn?ref=${code}`;
  const shareText = `我在用「聪明的背单词工具」背单词，推荐给你！${shareUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "聪明的背单词工具",
          text: "我在用这个工具背单词，推荐给你！",
          url: shareUrl,
        });
      } catch {
        handleCopy();
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">邀请码</p>
        <span className="font-mono text-lg font-bold tracking-wider">{code}</span>
      </div>

      {stats.total > 0 && (
        <p className="text-xs text-muted-foreground">
          已邀请 {stats.converted} 人
        </p>
      )}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? "已复制" : "复制"}
        </Button>
        <Button size="sm" onClick={handleShare} className="flex-1">
          <Share2 className="h-4 w-4 mr-1" />
          分享
        </Button>
      </div>
    </div>
  );
}
