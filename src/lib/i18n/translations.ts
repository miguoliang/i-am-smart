/**
 * Translation strings for the application
 * Currently supports Chinese (zh-CN) as the default language
 * 
 * This structure can be easily extended to support multiple languages
 * by adding additional language objects (e.g., en-US, ja-JP)
 */

export type Locale = "zh-CN";

export interface Translations {
  // Auth & Permissions
  auth: {
    unauthorized: string;
    forbidden: string;
    notLoggedIn: string;
  };

  // Validation & Errors
  validation: {
    invalidFormat: string;
    required: string;
    invalidEmail: string;
    emailRequired: string;
    pageMustBeGreaterThanZero: string;
    pageSizeMustBeBetween: string;
    invalidSubscriptionObject: string;
    invalidCardId: string;
    qualityMustBeBetween: string;
    invalidLevel: string;
    invalidAccountIdFormat: string;
    invalidTimezoneOffset: string;
    noSubscriptionsFound: string;
  };

  // Feedback
  feedback: {
    selectOccupation: string;
    selectLearningPurpose: string;
    selectFragmentTimeHelpful: string;
    explainNotHelpful: string;
    reasonTooLong: string;
    fragmentTimeHelpfulInvalid: string;
    selectWillRecommend: string;
    recommendInvalid: string;
    explainNotRecommend: string;
    notRecommendReasonTooLong: string;
    openFeedbackInvalid: string;
    openFeedbackTooLong: string;
    submitted: string;
    submitFailed: string;
  };

  // Common
  common: {
    retry: string;
    refresh: string;
    loading: string;
    error: string;
    success: string;
  };

  // Error Boundary
  errorBoundary: {
    somethingWentWrong: string;
    errorOccurred: string;
    errorDetailsDev: string;
    retry: string;
    refreshPage: string;
  };

  // Navigation
  navigation: {
    home: string;
    features: string;
    docs: string;
    blog: string;
    about: string;
    startLearning: string;
  };

  // Operator
  operator: {
    checkingPermissions: string;
  };

  // Cards
  cards: {
    cardNotFound: string;
    dailyLimitExceeded: string;
    dailyLimitReached: string;
  };

  // Stats
  stats: {
    noData: string;
  };
}

export const translations: Record<Locale, Translations> = {
  "zh-CN": {
    auth: {
      unauthorized: "未登录",
      forbidden: "权限不足",
      notLoggedIn: "未登录",
    },
    validation: {
      invalidFormat: "反馈内容格式无效",
      required: "必填项",
      invalidEmail: "邮箱格式不正确",
      emailRequired: "邮箱不能为空",
      pageMustBeGreaterThanZero: "Page must be greater than 0",
      pageSizeMustBeBetween: "Page size must be between 1 and {max}",
      invalidSubscriptionObject: "Invalid subscription object",
      invalidCardId: "无效的卡片ID",
      qualityMustBeBetween: "评分必须在 {min}-{max} 之间",
      invalidLevel: "Invalid level. Must be one of: A1, A2, B1, B2, C1, C2",
      invalidAccountIdFormat: "无效的账户ID格式",
      invalidTimezoneOffset: "Invalid timezone offset",
      noSubscriptionsFound: "No subscriptions found",
    },
    feedback: {
      selectOccupation: "请选择您的职业",
      selectLearningPurpose: "请至少选择一个英语学习的目的",
      selectFragmentTimeHelpful: "请选择这个app对充分利用碎片时间是否有帮助",
      explainNotHelpful: "请说明为什么觉得没有帮助",
      reasonTooLong: "原因不能超过{max}字",
      fragmentTimeHelpfulInvalid: "碎片时间帮助选择无效",
      selectWillRecommend: "请选择是否会推荐给朋友",
      recommendInvalid: "推荐选择无效",
      explainNotRecommend: "请说明不推荐的原因",
      notRecommendReasonTooLong: "不推荐原因不能超过{max}字",
      openFeedbackInvalid: "开放意见格式无效",
      openFeedbackTooLong: "开放意见不能超过{max}字",
      submitted: "反馈已提交，感谢您的建议！",
      submitFailed: "提交反馈失败，请稍后重试",
    },
    common: {
      retry: "重试",
      refresh: "刷新",
      loading: "加载中",
      error: "错误",
      success: "成功",
    },
    errorBoundary: {
      somethingWentWrong: "出现了一些问题",
      errorOccurred: "抱歉，应用遇到了一个错误。我们已经记录了这个问题，请尝试刷新页面。",
      errorDetailsDev: "错误详情（开发模式）",
      retry: "重试",
      refreshPage: "刷新页面",
    },
    navigation: {
      home: "首页",
      features: "功能",
      docs: "文档",
      blog: "博客",
      about: "关于",
      startLearning: "开始学习",
    },
    operator: {
      checkingPermissions: "校验权限中…",
    },
    cards: {
      cardNotFound: "卡片不存在",
      dailyLimitExceeded: "今日已复习{limit}张卡片，已达到每日限制",
      dailyLimitReached: "今日已复习{limit}张卡片，已达到每日限制",
    },
    stats: {
      noData: "暂无数据",
    },
  },
};

/**
 * Get translation for current locale
 * @param locale - The locale to use (defaults to "zh-CN")
 * @returns Translation object for the locale
 */
export function getTranslations(locale: Locale = "zh-CN"): Translations {
  return translations[locale];
}

/**
 * Simple translation function with placeholder support
 * @param text - Text with placeholders like {key}
 * @param params - Object with values to replace placeholders
 * @returns Translated text with placeholders replaced
 */
export function translate(text: string, params?: Record<string, string | number>): string {
  if (!params) return text;
  
  return Object.entries(params).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }, text);
}
