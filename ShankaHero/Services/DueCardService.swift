import Foundation
import SwiftData

struct DueCardItem: Identifiable {
    let id: String
    let knowledge: KnowledgeEntry
    let progress: CardProgress
}

enum DueCardService {
    static func reviewedTodayCount(progressList: [CardProgress]) -> Int {
        progressList.filter { progress in
            guard let lastReviewedAt = progress.lastReviewedAt else { return false }
            return DateHelpers.isToday(lastReviewedAt)
        }.count
    }

    static func dueCards(
        knowledgeEntries: [KnowledgeEntry],
        progressByKnowledgeId: [String: CardProgress],
        levels: [String],
        dailyDueLimit: Int,
        reviewedToday: Int
    ) -> [DueCardItem] {
        let levelSet = Set(levels)
        let remaining = max(0, dailyDueLimit - reviewedToday)
        guard remaining > 0 else { return [] }

        let endOfToday = DateHelpers.endOfToday
        let due = knowledgeEntries
            .filter { levelSet.contains($0.level) }
            .compactMap { knowledge -> DueCardItem? in
                guard let progress = progressByKnowledgeId[knowledge.id] else { return nil }
                guard progress.nextReviewDate <= endOfToday else { return nil }
                if let lastReviewed = progress.lastReviewedAt, DateHelpers.isToday(lastReviewed) {
                    return nil
                }
                return DueCardItem(id: knowledge.id, knowledge: knowledge, progress: progress)
            }
            .sorted { $0.progress.nextReviewDate < $1.progress.nextReviewDate }

        return Array(due.prefix(remaining))
    }

    static func examVocabProgress(
        knowledgeEntries: [KnowledgeEntry],
        progressByKnowledgeId: [String: CardProgress],
        levels: [String]
    ) -> (brushed: Int, total: Int) {
        let levelSet = Set(levels)
        let scoped = knowledgeEntries.filter { levelSet.contains($0.level) }
        let brushed = scoped.filter { knowledge in
            guard let progress = progressByKnowledgeId[knowledge.id] else { return false }
            return progress.repetitions > 0
        }.count
        return (brushed, scoped.count)
    }
}
