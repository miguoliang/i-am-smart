import Foundation
import SwiftData

@Model
final class CardProgress {
    @Attribute(.unique) var knowledgeId: String
    var easeFactor: Double
    var repetitions: Int
    var intervalDays: Int
    var nextReviewDate: Date
    var lastReviewedAt: Date?

    init(
        knowledgeId: String,
        easeFactor: Double = SM2Constants.defaultEaseFactor,
        repetitions: Int = 0,
        intervalDays: Int = 0,
        nextReviewDate: Date = DateHelpers.startOfToday,
        lastReviewedAt: Date? = nil
    ) {
        self.knowledgeId = knowledgeId
        self.easeFactor = easeFactor
        self.repetitions = repetitions
        self.intervalDays = intervalDays
        self.nextReviewDate = nextReviewDate
        self.lastReviewedAt = lastReviewedAt
    }
}
