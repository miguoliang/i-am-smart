"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { broadcastPush } from "@/lib/api/operator";
import { useOperatorAuth } from "../hooks/useOperatorAuth";
import { Button } from "@/components/form/Button";
import { Input } from "@/components/form/Input";
import { Textarea } from "@/components/form/Textarea";
import { Label } from "@/components/form/Label";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { toast } from "sonner";

export default function PushPage() {
  useOperatorAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const mutation = useMutation({
    mutationFn: () => broadcastPush({ title, body }),
    onSuccess: (data) => {
      toast.success(`推送完成：${data.sent}/${data.total} 成功`);
      setTitle("");
      setBody("");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          推送通知
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          向所有已订阅用户发送推送通知
        </p>
      </div>

      <div className="max-w-lg space-y-4">
        <div>
          <Label htmlFor="push-title">标题</Label>
          <Input
            id="push-title"
            placeholder="通知标题（最多 200 字）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="push-body">内容</Label>
          <Textarea
            id="push-body"
            placeholder="通知内容（最多 1000 字）"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={1000}
            rows={4}
            className="mt-1"
          />
        </div>

        <Button
          onClick={() => mutation.mutate()}
          disabled={!canSend || mutation.isPending}
          loading={mutation.isPending}
        >
          发送推送
        </Button>
      </div>
    </div>
  );
}
