// src/app/api/knowledge/route.ts
import { NextRequest } from "next/server";
import { createKnowledgeService } from "@/lib/services/factory";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { t, translate } from "@/lib/i18n";
import type { KnowledgeItem } from "@/lib/services/knowledgeService";

async function fetchPendingReportCodes(admin: ReturnType<typeof createSupabaseAdmin>): Promise<string[]> {
  const { data, error } = await admin
    .from("knowledge_error_reports")
    .select("knowledge_code")
    .is("resolved_at", null);

  if (error) throw ApiError.internal(error.message);
  return [...new Set((data ?? []).map((r) => r.knowledge_code as string))];
}

async function fetchPendingReportCountsByCode(
  admin: ReturnType<typeof createSupabaseAdmin>,
  codes: string[]
): Promise<Map<string, number>> {
  if (codes.length === 0) return new Map();

  const { data, error } = await admin
    .from("knowledge_error_reports")
    .select("knowledge_code")
    .in("knowledge_code", codes)
    .is("resolved_at", null);

  if (error) throw ApiError.internal(error.message);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const c = row.knowledge_code as string;
    map.set(c, (map.get(c) ?? 0) + 1);
  }
  return map;
}

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireOperator(req);

    logger.debug("Knowledge GET: Operator authenticated", {
      userId: user.id,
    });

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);
    const search = searchParams.get("search")?.trim() || undefined;
    const level = searchParams.get("level")?.trim() || undefined;
    const pendingReportsOnly =
      searchParams.get("pendingReportsOnly") === "1" ||
      searchParams.get("pendingReportsOnly") === "true";

    if (page < 1) {
      throw ApiError.validationError(t().validation.pageMustBeGreaterThanZero);
    }
    if (pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
      throw ApiError.validationError(
        translate(t().validation.pageSizeMustBeBetween, { max: MAX_PAGE_SIZE })
      );
    }

    const admin = createSupabaseAdmin();
    let restrictToCodes: string[] | undefined;

    if (pendingReportsOnly) {
      restrictToCodes = await fetchPendingReportCodes(admin);
      if (restrictToCodes.length === 0) {
        return apiSuccess({
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        });
      }
    }

    const knowledgeService = await createKnowledgeService(supabase);
    const result = await knowledgeService.getPaginatedKnowledge({
      page,
      pageSize,
      search,
      level,
      restrictToCodes,
    });

    const codes = result.data.map((k) => k.code);
    const countByCode = await fetchPendingReportCountsByCode(admin, codes);
    const data = result.data.map((k: KnowledgeItem) => ({
      ...k,
      pending_error_report_count: countByCode.get(k.code) ?? 0,
    }));

    logger.debug("Knowledge GET: Success", {
      userId: user.id,
      page,
      pageSize,
      total: result.total,
      totalPages: result.totalPages,
      count: data.length,
    });

    return apiSuccess({
      ...result,
      data,
    });
  } catch (error) {
    logger.error("Knowledge GET: Error", { error });
    return handleApiError(error);
  }
}
