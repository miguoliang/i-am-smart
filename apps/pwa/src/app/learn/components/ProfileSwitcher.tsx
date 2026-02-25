"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfile, deleteProfile, updateProfile } from "@/lib/api/profiles";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { cn } from "@/lib/utils";
import { UserCircle, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/overlay/Dialog";

type ModalState =
  | { type: "idle" }
  | { type: "add" }
  | { type: "edit"; profileId: string; currentName: string }
  | { type: "delete"; profileId: string; profileName: string };

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId } = useProfile();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ type: "idle" });
  const [inputValue, setInputValue] = useState("");

  const closeModal = () => {
    setModal({ type: "idle" });
    setInputValue("");
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => createProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("档案创建成功");
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateProfile(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("档案已更新");
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("档案已删除");
      closeModal();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmitName = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (modal.type === "add") {
      createMutation.mutate(trimmed);
    } else if (modal.type === "edit" && trimmed !== modal.currentName) {
      updateMutation.mutate({ id: modal.profileId, name: trimmed });
    } else {
      closeModal();
    }
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">学习档案</span>
          <button
            onClick={() => {
              setInputValue("");
              setModal({ type: "add" });
            }}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            添加
          </button>
        </div>
        <div className="space-y-1">
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer",
                profile.id === activeProfile?.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              <button
                onClick={() => setActiveProfileId(profile.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <UserCircle className="h-5 w-5" />
                <span className="text-sm font-medium">{profile.name}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setInputValue(profile.name);
                  setModal({
                    type: "edit",
                    profileId: profile.id,
                    currentName: profile.name,
                  });
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <Pencil className="h-3 w-3" />
              </button>
              {!profile.is_default && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({
                      type: "delete",
                      profileId: profile.id,
                      profileName: profile.name,
                    });
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-1 text-muted-foreground hover:text-destructive rounded"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Name input dialog */}
      <Dialog
        open={modal.type === "add" || modal.type === "edit"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>
              {modal.type === "add" ? "新建档案" : "修改档案名称"}
            </DialogTitle>
            <DialogDescription>输入档案名称（1-20个字符）</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitName();
            }}
          >
            <input
              autoFocus
              type="text"
              maxLength={20}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="档案名称"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <DialogFooter className="mt-4">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim() || isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                确定
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={modal.type === "delete"}
        onOpenChange={(open) => {
          if (!open) closeModal();
        }}
      >
        <DialogContent className="max-w-sm rounded-xl">
          <DialogHeader>
            <DialogTitle>删除档案</DialogTitle>
            <DialogDescription>
              确定删除「{modal.type === "delete" ? modal.profileName : ""}
              」的学习档案？所有学习数据将被清除。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                if (modal.type === "delete") deleteMutation.mutate(modal.profileId);
              }}
              disabled={isPending}
              className="rounded-lg bg-destructive px-4 py-2 text-sm text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              删除
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
