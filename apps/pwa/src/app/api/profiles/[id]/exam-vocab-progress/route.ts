import { NextRequest } from "next/server";
import { EXAM_TARGETS } from "@i-am-smart/shared/constants";
import { requireAuth } from "@/lib/middleware/auth";
import { ApiError, apiSuccess, handleApiError } from "@/lib/utils/apiError";
import type { ExamVocabProgressItem } from "@/lib/api/examVocabProgress";

interface RpcRow {
  total: number;
  brushed: number;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(_req);
    const { id: profileId } = await params;

    const { data: profile, error: profileError } = await supabase
      .from("learner_profiles")
      .select("id")
      .eq("id", profileId)
      .eq("account_id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }
    if (!profile) {
      throw ApiError.notFound("未找到学习档案");
    }

    const results = await Promise.all(
      EXAM_TARGETS.map(async (exam) => {
        const { data, error } = await supabase.rpc("count_vocab_and_brushed", {
          p_profile_id: profileId,
          p_levels: exam.levels,
        });

        if (error) {
          throw new Error(error.message);
        }

        const row = data as RpcRow | null;
        const total = typeof row?.total === "number" ? row.total : 0;
        const brushed = typeof row?.brushed === "number" ? row.brushed : 0;

        const item: ExamVocabProgressItem = {
          examId: exam.id,
          name: exam.name,
          total,
          brushed,
        };
        return item;
      })
    );

    return apiSuccess(results);
  } catch (error) {
    return handleApiError(error);
  }
}
