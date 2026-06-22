import Foundation
import SwiftData

@Model
final class ReviewRecord {
    var knowledgeId: String
    var reviewedAt: Date

    init(knowledgeId: String, reviewedAt: Date = .now) {
        self.knowledgeId = knowledgeId
        self.reviewedAt = reviewedAt
    }
}
