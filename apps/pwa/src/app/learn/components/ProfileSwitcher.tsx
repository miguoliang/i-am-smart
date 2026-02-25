"use client";

import { useEffect, useRef, useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfile, deleteProfile, updateProfile } from "@/lib/api/profiles";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { cn } from "@/lib/utils";
import { UserCircle, Plus, Pencil, Trash2, Check, X } from "lucide-react";

type EditingState =
  | { type: "idle" }
  | { type: "add" }
  | { type: "edit"; profileId: string; originalName: string };

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId } = useProfile();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<EditingState>({ type: "idle" });
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing.type !== "idle") {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
        // iOS keyboard may obscure the input inside a bottom sheet;
        // scroll it into view after the keyboard animates in.
        setTimeout(() => {
          inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 300);
      });
    }
  }, [editing]);

  const stopEditing = () => {
    setEditing({ type: "idle" });
    setInputValue("");
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => createProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("档案创建成功");
      stopEditing();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateProfile(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("档案已更新");
      stopEditing();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProfile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("档案已删除");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    if (editing.type === "add") {
      createMutation.mutate(trimmed);
    } else if (editing.type === "edit" && trimmed !== editing.originalName) {
      updateMutation.mutate({ id: editing.profileId, name: trimmed });
    } else {
      stopEditing();
    }
  };

  const handleDelete = (profileId: string, profileName: string) => {
    toast(`确定删除「${profileName}」？`, {
      description: "所有学习数据将被清除",
      action: {
        label: "删除",
        onClick: () => deleteMutation.mutate(profileId),
      },
      cancel: {
        label: "取消",
        onClick: () => {},
      },
    });
  };

  const isPending =
    createMutation.isPending || updateMutation.isPending;

  const inlineInput = (
    <form
      className="flex items-center gap-1 flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <input
        ref={inputRef}
        type="text"
        maxLength={20}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") stopEditing();
        }}
        placeholder="档案名称"
        className="flex-1 min-w-0 rounded border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      <button
        type="submit"
        disabled={!inputValue.trim() || isPending}
        className="p-1 text-primary hover:text-primary/80 disabled:opacity-40"
      >
        <Check className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={stopEditing}
        className="p-1 text-muted-foreground hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">学习档案</span>
        <button
          onClick={() => {
            setInputValue("");
            setEditing({ type: "add" });
          }}
          disabled={editing.type !== "idle"}
          className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-40"
        >
          <Plus className="h-3 w-3" />
          添加
        </button>
      </div>

      <div className="space-y-1">
        {profiles.map((profile) => {
          const isEditing =
            editing.type === "edit" && editing.profileId === profile.id;

          return (
            <div
              key={profile.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors",
                !isEditing && "cursor-pointer",
                profile.id === activeProfile?.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent",
              )}
            >
              {isEditing ? (
                <>
                  <UserCircle className="h-5 w-5 shrink-0" />
                  {inlineInput}
                </>
              ) : (
                <>
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
                      setEditing({
                        type: "edit",
                        profileId: profile.id,
                        originalName: profile.name,
                      });
                    }}
                    disabled={editing.type !== "idle"}
                    className="p-1 text-muted-foreground hover:text-foreground rounded"
                  >
                    <Pencil className="h-3 w-3" />
                  </button>
                  {!profile.is_default && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(profile.id, profile.name);
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-1 text-muted-foreground hover:text-destructive rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Inline add row */}
        {editing.type === "add" && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 bg-accent/50">
            <UserCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
            {inlineInput}
          </div>
        )}
      </div>
    </div>
  );
}
