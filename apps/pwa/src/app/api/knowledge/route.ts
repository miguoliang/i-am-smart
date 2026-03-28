// src/app/api/knowledge/route.ts
import { NextRequest } from "next/server";
import { createKnowledgeService } from "@/lib/services/factory";
import { ApiError, handleApiError, apiSuccess } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import { MAX_PAGE_SIZE } from "@/lib/constants";
import { t, translate } from "@/lib/i18n";
import type { KnowledgeItem } from "@/lib/services/knowledgeService";

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

    const knowledgeService = await createKnowledgeService(supabase);
    const result = await knowledgeService.getPaginatedKnowledge({
      page,
      pageSize,
      search,
      level,
      needsCorrectionOnly: pendingReportsOnly,
    });

    const data = result.data.map((k: KnowledgeItem) => ({
      ...k,
      pending_error_report_count: k.needs_correction ? 1 : 0,
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
