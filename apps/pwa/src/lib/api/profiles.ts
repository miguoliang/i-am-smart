// API functions for learner profiles
import type { ApiResponse } from "@/lib/utils/apiError";
import { parseApiErrorResponse } from "@/lib/utils/apiError";
import type { Level } from "@i-am-smart/shared/constants";

export interface LearnerProfile {
  id: string;
  account_id: string;
  name: string;
  avatar_index: number;
  level: Level;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchProfiles(): Promise<LearnerProfile[]> {
  const res = await fetch("/api/profiles");
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "获取学习档案失败");
    throw new Error(message);
  }
  const json: ApiResponse<LearnerProfile[]> = await res.json();
  return json.data ?? [];
}

export async function createProfile(name: string): Promise<LearnerProfile> {
  const res = await fetch("/api/profiles", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "创建学习档案失败");
    throw new Error(message);
  }
  const json: ApiResponse<LearnerProfile> = await res.json();
  return json.data!;
}

export async function updateProfile(profileId: string, updates: { name?: string; level?: Level }): Promise<LearnerProfile> {
  const res = await fetch(`/api/profiles/${profileId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "更新学习档案失败");
    throw new Error(message);
  }
  const json: ApiResponse<LearnerProfile> = await res.json();
  return json.data!;
}

export async function deleteProfile(profileId: string): Promise<void> {
  const res = await fetch(`/api/profiles/${profileId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "删除学习档案失败");
    throw new Error(message);
  }
}
