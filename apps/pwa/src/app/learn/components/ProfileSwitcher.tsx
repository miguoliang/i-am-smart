"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfile, deleteProfile, updateProfile } from "@/lib/api/profiles";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { cn } from "@/lib/utils";
import { UserCircle, Plus, Pencil, Trash2, Check, X } from "lucide-react";

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId } = useProfile();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const createMutation = useMutation({
    mutationFn: (name: string) => createProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setIsAdding(false);
      setNewName("");
      toast.success("档案创建成功");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateProfile(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setEditingId(null);
      toast.success("档案已更新");
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

  if (profiles.length <= 1 && !isAdding) {
    // Single profile, just show add button
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">学习档案</span>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            添加
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
          <UserCircle className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">{activeProfile?.name ?? "我"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">学习档案</span>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            添加
          </button>
        )}
      </div>

      <div className="space-y-1">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer",
              profile.id === activeProfile?.id
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent"
            )}
          >
            {editingId === profile.id ? (
              <div className="flex items-center gap-1 flex-1">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-transparent border-b border-primary text-sm outline-none"
                  maxLength={20}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") updateMutation.mutate({ id: profile.id, name: editName });
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <button
                  onClick={() => updateMutation.mutate({ id: profile.id, name: editName })}
                  disabled={updateMutation.isPending}
                  className="p-1 text-primary hover:bg-primary/10 rounded"
                >
                  <Check className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="p-1 text-muted-foreground hover:bg-accent rounded"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
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
                    setEditingId(profile.id);
                    setEditName(profile.name);
                  }}
                  className="p-1 text-muted-foreground hover:text-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ opacity: 1 }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                {!profile.is_default && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`确定删除「${profile.name}」的学习档案？所有学习数据将被清除。`)) {
                        deleteMutation.mutate(profile.id);
                      }
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
        ))}

        {isAdding && (
          <div className="flex items-center gap-1 px-3 py-2">
            <UserCircle className="h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="输入名称"
              className="flex-1 bg-transparent border-b border-primary text-sm outline-none"
              maxLength={20}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) createMutation.mutate(newName.trim());
                if (e.key === "Escape") { setIsAdding(false); setNewName(""); }
              }}
            />
            <button
              onClick={() => { if (newName.trim()) createMutation.mutate(newName.trim()); }}
              disabled={createMutation.isPending || !newName.trim()}
              className="p-1 text-primary hover:bg-primary/10 rounded disabled:opacity-50"
            >
              <Check className="h-3 w-3" />
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewName(""); }}
              className="p-1 text-muted-foreground hover:bg-accent rounded"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
