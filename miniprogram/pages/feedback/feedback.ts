/**
 * Feedback page - User feedback form
 */

import { request } from '../../utils/api';
import { API_ENDPOINTS } from '../../shared/constants/api';
import { isAuthenticated } from '../../utils/auth';

interface FeedbackData {
  occupation: string;
  learningPurpose: string[];
  fragmentTimeHelpful: string;
  fragmentTimeNotHelpfulReason?: string;
  willRecommend: string;
  notRecommendReason?: string;
  openFeedback?: string;
}

const occupationOptions = [
  { value: 'student', label: '学生' },
  { value: 'office_worker', label: '上班族' },
  { value: 'teacher', label: '教师' },
  { value: 'freelancer', label: '自由职业者' },
  { value: 'retired', label: '退休' },
  { value: 'other_occupation', label: '其他' },
];

const learningPurposeOptions = [
  { value: 'exam', label: '考试（四六级/雅思/托福等）' },
  { value: 'work', label: '工作需要' },
  { value: 'travel', label: '旅游/出国' },
  { value: 'children_education', label: '子女教育' },
];

Page({
  data: {
    loading: false,
    occupation: '',
    learningPurpose: [] as string[],
    fragmentTimeHelpful: '',
    fragmentTimeNotHelpfulReason: '',
    willRecommend: '',
    notRecommendReason: '',
    openFeedback: '',
    errors: {} as Record<string, string>,
    occupationOptions,
    learningPurposeOptions,
  },

  async onLoad() {
    // Wait for authentication before loading
    await this.waitForAuth();
  },

  async waitForAuth() {
    const app = getApp();
    if (app.globalData.authPromise) {
      try {
        const isAuth = await app.globalData.authPromise;
        if (!isAuth) {
          console.log('Not authenticated, cannot submit feedback');
          return false;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        return false;
      }
    } else if (!isAuthenticated()) {
      console.log('No auth promise and not authenticated');
      return false;
    }
    return true;
  },

  onOccupationChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail.value;
    this.setData({ occupation: value });
    this.clearError('occupation');
  },

  onLearningPurposeChange(e: WechatMiniprogram.CustomEvent) {
    const values = e.detail.value as string[];
    this.setData({ learningPurpose: values });
    this.clearError('learningPurpose');
  },

  onFragmentTimeHelpfulChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail.value;
    this.setData({ fragmentTimeHelpful: value });
    this.clearError('fragmentTimeHelpful');
    if (value !== 'no') {
      this.setData({ fragmentTimeNotHelpfulReason: '' });
    }
  },

  onFragmentTimeNotHelpfulReasonInput(e: WechatMiniprogram.CustomEvent) {
    this.setData({ fragmentTimeNotHelpfulReason: e.detail.value });
    this.clearError('fragmentTimeNotHelpfulReason');
  },

  onWillRecommendChange(e: WechatMiniprogram.CustomEvent) {
    const value = e.detail.value;
    this.setData({ willRecommend: value });
    this.clearError('willRecommend');
    if (value !== 'no') {
      this.setData({ notRecommendReason: '' });
    }
  },

  onNotRecommendReasonInput(e: WechatMiniprogram.CustomEvent) {
    this.setData({ notRecommendReason: e.detail.value });
    this.clearError('notRecommendReason');
  },

  onOpenFeedbackInput(e: WechatMiniprogram.CustomEvent) {
    this.setData({ openFeedback: e.detail.value });
  },

  clearError(field: string) {
    const errors = { ...this.data.errors };
    delete errors[field];
    this.setData({ errors });
  },

  validate(): boolean {
    const errors: Record<string, string> = {};

    if (!this.data.occupation) {
      errors.occupation = '请选择您的职业';
    }
    if (this.data.learningPurpose.length === 0) {
      errors.learningPurpose = '请至少选择一个英语学习的目的';
    }
    if (!this.data.fragmentTimeHelpful) {
      errors.fragmentTimeHelpful = '请选择这个app对充分利用碎片时间是否有帮助';
    }
    if (this.data.fragmentTimeHelpful === 'no' && !this.data.fragmentTimeNotHelpfulReason.trim()) {
      errors.fragmentTimeNotHelpfulReason = '请说明为什么觉得没有帮助';
    }
    if (!this.data.willRecommend) {
      errors.willRecommend = '请选择是否会推荐给朋友';
    }
    if (this.data.willRecommend === 'no' && !this.data.notRecommendReason.trim()) {
      errors.notRecommendReason = '请说明不推荐的原因';
    }

    this.setData({ errors });
    return Object.keys(errors).length === 0;
  },

  async onSubmit() {
    if (!isAuthenticated()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
      });
      return;
    }

    if (!this.validate()) {
      wx.showToast({
        title: '请填写所有必填项',
        icon: 'none',
      });
      return;
    }

    this.setData({ loading: true });

    try {
      const feedbackData: FeedbackData = {
        occupation: this.data.occupation,
        learningPurpose: this.data.learningPurpose,
        fragmentTimeHelpful: this.data.fragmentTimeHelpful,
        fragmentTimeNotHelpfulReason:
          this.data.fragmentTimeHelpful === 'no'
            ? this.data.fragmentTimeNotHelpfulReason.trim()
            : undefined,
        willRecommend: this.data.willRecommend,
        notRecommendReason:
          this.data.willRecommend === 'no' ? this.data.notRecommendReason.trim() : undefined,
        openFeedback: this.data.openFeedback.trim() || undefined,
      };

      await request(API_ENDPOINTS.FEEDBACK, {
        method: 'POST',
        data: {
          content: feedbackData,
        },
      });

      wx.showToast({
        title: '反馈已提交，感谢您的建议！',
        icon: 'success',
      });

      // Reset form
      this.setData({
        occupation: '',
        learningPurpose: [],
        fragmentTimeHelpful: '',
        fragmentTimeNotHelpfulReason: '',
        willRecommend: '',
        notRecommendReason: '',
        openFeedback: '',
        errors: {},
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '提交失败，请稍后重试';
      console.error('Feedback submission failed:', error);
      wx.showToast({
        title: errorMessage,
        icon: 'none',
      });
    } finally {
      this.setData({ loading: false });
    }
  },
});
