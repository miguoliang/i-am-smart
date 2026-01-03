"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

interface FeedbackData {
  occupation: string;
  learningPurpose: string[];
  fragmentTimeHelpful: string;
  fragmentTimeNotHelpfulReason?: string;
  willRecommend: string;
  notRecommendReason?: string;
  openFeedback?: string;
}

export default function FeedbackPage() {
  const [occupation, setOccupation] = useState("");
  const [learningPurpose, setLearningPurpose] = useState<string[]>([]);
  const [fragmentTimeHelpful, setFragmentTimeHelpful] = useState("");
  const [fragmentTimeNotHelpfulReason, setFragmentTimeNotHelpfulReason] = useState("");
  const [willRecommend, setWillRecommend] = useState("");
  const [notRecommendReason, setNotRecommendReason] = useState("");
  const [openFeedback, setOpenFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const occupationOptions = [
    { value: "student", label: "学生" },
    { value: "office_worker", label: "上班族" },
    { value: "teacher", label: "教师" },
    { value: "freelancer", label: "自由职业者" },
    { value: "retired", label: "退休" },
    { value: "other_occupation", label: "其他" },
  ];

  const learningPurposeOptions = [
    { value: "exam", label: "考试（四六级/雅思/托福等）" },
    { value: "work", label: "工作需要" },
    { value: "travel", label: "旅游/出国" },
    { value: "children_education", label: "子女教育" },
  ];

  const fragmentTimeHelpfulOptions = [
    { value: "yes", label: "是" },
    { value: "no", label: "否" },
  ];

  const handleLearningPurposeToggle = (value: string) => {
    setLearningPurpose((prev) => {
      if (prev.includes(value)) {
        return prev.filter((v) => v !== value);
      }
      return [...prev, value];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!occupation) {
      toast.error("请选择您的职业");
      return;
    }

    if (learningPurpose.length === 0) {
      toast.error("请至少选择一个英语学习的目的");
      return;
    }

    if (!fragmentTimeHelpful) {
      toast.error("请选择这个app对充分利用碎片时间是否有帮助");
      return;
    }

    if (fragmentTimeHelpful === "no" && !fragmentTimeNotHelpfulReason.trim()) {
      toast.error("请说明为什么觉得没有帮助");
      return;
    }

    if (!willRecommend) {
      toast.error("请选择是否会推荐给朋友");
      return;
    }

    if (willRecommend === "no" && !notRecommendReason.trim()) {
      toast.error("请说明不推荐的原因");
      return;
    }

    setLoading(true);
    try {
      const feedbackData: FeedbackData = {
        occupation,
        learningPurpose,
        fragmentTimeHelpful,
        fragmentTimeNotHelpfulReason: fragmentTimeHelpful === "no" ? fragmentTimeNotHelpfulReason.trim() : undefined,
        willRecommend,
        notRecommendReason: willRecommend === "no" ? notRecommendReason.trim() : undefined,
        openFeedback: openFeedback.trim() || undefined,
      };

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: feedbackData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error?.message || "提交失败，请稍后重试";
        toast.error(errorMessage);
        logger.error("Feedback submission failed", { data });
        return;
      }

      toast.success(data.data?.message || "反馈已提交，感谢您的建议！");
      // Reset form
      setOccupation("");
      setLearningPurpose([]);
      setFragmentTimeHelpful("");
      setFragmentTimeNotHelpfulReason("");
      setWillRecommend("");
      setNotRecommendReason("");
      setOpenFeedback("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "提交失败，请检查网络连接";
      logger.error("Feedback submission exception", { error: err, message: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col pb-20">
      <div className="flex-1 max-w-2xl w-full mx-auto p-5 md:p-8 lg:p-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900 dark:text-white">
          反馈问卷
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 md:mb-8">
          感谢你的反馈！会直接决定我们下一步加什么～
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Question 1: Occupation */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              1. 您的职业是？（单选）
            </Label>
            <div className="space-y-2">
              {occupationOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-md border border-input hover:bg-accent cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="occupation"
                    value={option.value}
                    checked={occupation === option.value}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 2: Learning Purpose */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              2. 您学习英语的目的是什么？（可多选）
            </Label>
            <div className="space-y-2">
              {learningPurposeOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-md border border-input hover:bg-accent cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={learningPurpose.includes(option.value)}
                    onCheckedChange={() => handleLearningPurposeToggle(option.value)}
                  />
                  <span className="text-sm flex-1">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 3: Fragment Time Helpful */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              3. 你觉得这个app对充分利用碎片时间是否有帮助？（单选）
            </Label>
            <div className="space-y-2">
              {fragmentTimeHelpfulOptions.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-3 rounded-md border border-input hover:bg-accent cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name="fragmentTimeHelpful"
                    value={option.value}
                    checked={fragmentTimeHelpful === option.value}
                    onChange={(e) => setFragmentTimeHelpful(e.target.value)}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            {fragmentTimeHelpful === "no" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="fragmentTimeNotHelpfulReason" className="text-sm">
                  请说明为什么觉得没有帮助：
                </Label>
                <Textarea
                  id="fragmentTimeNotHelpfulReason"
                  placeholder="请告诉我们为什么觉得没有帮助..."
                  value={fragmentTimeNotHelpfulReason}
                  onChange={(e) => setFragmentTimeNotHelpfulReason(e.target.value)}
                  className="min-h-[100px] resize-y"
                  maxLength={1000}
                  required
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {fragmentTimeNotHelpfulReason.length}/1000
                </p>
              </div>
            )}
          </div>

          {/* Question 4: Will Recommend */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              4. 您会把这个App推荐给朋友吗？
            </Label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-md border border-input hover:bg-accent cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="willRecommend"
                  value="yes"
                  checked={willRecommend === "yes"}
                  onChange={(e) => setWillRecommend(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm">会</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-md border border-input hover:bg-accent cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="willRecommend"
                  value="no"
                  checked={willRecommend === "no"}
                  onChange={(e) => setWillRecommend(e.target.value)}
                  className="w-4 h-4 text-primary focus:ring-primary"
                />
                <span className="text-sm">不会</span>
              </label>
            </div>
            {willRecommend === "no" && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="notRecommendReason" className="text-sm">
                  请说明不推荐的原因：
                </Label>
                <Textarea
                  id="notRecommendReason"
                  placeholder="请告诉我们为什么不推荐..."
                  value={notRecommendReason}
                  onChange={(e) => setNotRecommendReason(e.target.value)}
                  className="min-h-[100px] resize-y"
                  maxLength={1000}
                  required={willRecommend === "no"}
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {notRecommendReason.length}/1000
                </p>
              </div>
            )}
          </div>

          {/* Question 5: Open Feedback */}
          <div className="space-y-2">
            <Label htmlFor="openFeedback" className="text-base font-semibold">
              5. 改进建议（可选）
            </Label>
            <Textarea
              id="openFeedback"
              placeholder="请分享你的改进建议..."
              value={openFeedback}
              onChange={(e) => setOpenFeedback(e.target.value)}
              className="min-h-[120px] resize-y"
              maxLength={2000}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {openFeedback.length}/2000
            </p>
          </div>

          <Button
            type="submit"
            loading={loading}
            size="lg"
            className="w-full py-3.5 md:py-4 lg:py-5 px-6 md:px-8 min-h-[48px] md:min-h-[52px] touch-manipulation"
          >
            提交反馈
          </Button>
        </form>
      </div>
    </div>
  );
}
