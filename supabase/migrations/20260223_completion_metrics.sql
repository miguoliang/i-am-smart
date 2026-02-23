-- 词库完成率指标
-- 返回：按考试目标分组的完成率统计
CREATE OR REPLACE FUNCTION get_completion_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'overall', (
      SELECT json_build_object(
        'totalProfiles', COUNT(DISTINCT lp.id),
        'completedProfiles', COUNT(DISTINCT lp.id) FILTER (
          WHERE NOT EXISTS (
            SELECT 1 FROM account_cards ac
            WHERE ac.profile_id = lp.id
            AND (ac.next_review_date <= NOW() OR ac.repetitions = 0)
          )
          AND EXISTS (
            SELECT 1 FROM account_cards ac WHERE ac.profile_id = lp.id
          )
        ),
        'avgMasteredPct', ROUND(AVG(
          CASE WHEN profile_total > 0
            THEN (profile_mastered::numeric / profile_total * 100)
            ELSE 0
          END
        ), 1)
      )
      FROM learner_profiles lp
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS profile_total,
          COUNT(*) FILTER (WHERE repetitions >= 3 AND ease_factor >= 2.0) AS profile_mastered
        FROM account_cards ac
        WHERE ac.profile_id = lp.id
      ) stats ON true
    ),
    'byExam', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          COALESCE(lp.exam_target, 'unknown') AS exam_target,
          COUNT(DISTINCT lp.id) AS profiles,
          ROUND(AVG(
            CASE WHEN stats.profile_total > 0
              THEN (stats.profile_mastered::numeric / stats.profile_total * 100)
              ELSE 0
            END
          ), 1) AS avg_mastered_pct,
          SUM(stats.profile_mastered) AS total_mastered,
          SUM(stats.profile_total) AS total_cards
        FROM learner_profiles lp
        LEFT JOIN LATERAL (
          SELECT
            COUNT(*) AS profile_total,
            COUNT(*) FILTER (WHERE repetitions >= 3 AND ease_factor >= 2.0) AS profile_mastered
          FROM account_cards ac
          WHERE ac.profile_id = lp.id
        ) stats ON true
        GROUP BY COALESCE(lp.exam_target, 'unknown')
        ORDER BY profiles DESC
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 推荐效果指标（增强版，基于已有的 referrals 表）
CREATE OR REPLACE FUNCTION get_referral_metrics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalReferrals', (SELECT COUNT(*) FROM referrals),
    'convertedReferrals', (SELECT COUNT(*) FROM referrals WHERE status = 'converted'),
    'conversionRate', (
      SELECT CASE WHEN COUNT(*) > 0
        THEN ROUND(COUNT(*) FILTER (WHERE status = 'converted')::numeric / COUNT(*) * 100, 1)
        ELSE 0
      END
      FROM referrals
    ),
    'referrerCount', (SELECT COUNT(DISTINCT referrer_id) FROM referrals),
    'avgReferralsPerUser', (
      SELECT CASE WHEN COUNT(DISTINCT referrer_id) > 0
        THEN ROUND(COUNT(*)::numeric / COUNT(DISTINCT referrer_id), 1)
        ELSE 0
      END
      FROM referrals
    ),
    'recentTrend', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT
          DATE(created_at) AS date,
          COUNT(*) AS referrals,
          COUNT(*) FILTER (WHERE status = 'converted') AS converted
        FROM referrals
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      ) t
    )
  ) INTO result;

  RETURN result;
END;
$$;
