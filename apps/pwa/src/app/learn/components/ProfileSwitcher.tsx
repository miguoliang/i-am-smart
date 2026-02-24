"use client";

import { useProfile } from "@/hooks/useProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProfile, deleteProfile, updateProfile } from "@/lib/api/profiles";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { cn } from "@/lib/utils";
import { UserCircle, Plus, Pencil, Trash2 } from "lucide-react";

export function ProfileSwitcher() {
  const { profiles, activeProfile, setActiveProfileId } = useProfile();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (name: string) => createProfile(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("档案创建成功");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => updateProfile(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
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

  const handleAdd = () => {
    const name = prompt("输入档案名称（1-20个字符）");
    if (name?.trim()) {
      createMutation.mutate(name.trim());
    }
  };

  const handleEdit = (profileId: string, currentName: string) => {
    const name = prompt("修改档案名称", currentName);
    if (name?.trim() && name.trim() !== currentName) {
      updateMutation.mutate({ id: profileId, name: name.trim() });
    }
  };

  const handleDelete = (profileId: string, profileName: string) => {
    if (confirm(`确定删除「${profileName}」的学习档案？所有学习数据将被清除。`)) {
      deleteMutation.mutate(profileId);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">学习档案</span>
        <button
          onClick={handleAdd}
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
                : "hover:bg-accent"
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
                handleEdit(profile.id, profile.name);
              }}
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
          </div>
        ))}
      </div>
    </div>
  );
}
