import Foundation

struct SM2ReviewInput {
    let easeFactor: Double
    let repetitions: Int
    let intervalDays: Int
}

struct SM2ReviewResult {
    let easeFactor: Double
    let repetitions: Int
    let intervalDays: Int
    let nextReviewDate: Date
}

enum SM2Engine {
    static func review(current: SM2ReviewInput, quality: Int) -> SM2ReviewResult {
        var newEase = current.easeFactor
        var newReps = current.repetitions
        var newInterval = current.intervalDays

        if quality >= SM2Constants.qualityThreshold {
            if newReps == 0 {
                newInterval = SM2Constants.firstInterval
            } else if newReps == 1 {
                newInterval = SM2Constants.secondInterval
            } else {
                newInterval = Int((Double(newInterval) * newEase).rounded())
            }
            newReps += 1
        } else {
            newReps = 0
            newInterval = SM2Constants.firstInterval
        }

        let qualityDelta = SM2Constants.maxQuality - quality
        newEase += SM2Constants.easeAdjustmentBase
            - Double(qualityDelta) * (
                SM2Constants.easeAdjustmentFactor
                    + Double(qualityDelta) * SM2Constants.easeAdjustmentPenalty
            )
        if newEase < SM2Constants.minEaseFactor {
            newEase = SM2Constants.minEaseFactor
        }

        var nextReview = DateHelpers.startOfToday
        nextReview = Calendar.current.date(byAdding: .day, value: newInterval, to: nextReview) ?? nextReview

        return SM2ReviewResult(
            easeFactor: (newEase * 100).rounded() / 100,
            repetitions: newReps,
            intervalDays: newInterval,
            nextReviewDate: nextReview
        )
    }
}
