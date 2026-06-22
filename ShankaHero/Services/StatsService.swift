import Foundation
import SwiftData

struct UserStats {
    let total: Int
    let mastered: Int
    let learning: Int
    let dueToday: Int
}

struct HeatmapPoint: Identifiable {
    let id: String
    let reviewDate: String
    let reviewCount: Int
}

enum StatsService {
    static func computeStats(
        progressList: [CardProgress],
        levels: [String],
        knowledgeEntries: [KnowledgeEntry]
    ) -> UserStats {
        let levelSet = Set(levels)
        let scopedKnowledgeIDs = Set(
            knowledgeEntries.filter { levelSet.contains($0.level) }.map(\.id)
        )
        let scopedProgress = progressList.filter { scopedKnowledgeIDs.contains($0.knowledgeId) }
        let endOfToday = DateHelpers.endOfToday

        let total = scopedProgress.count
        let mastered = scopedProgress.filter { $0.repetitions >= 7 && $0.intervalDays >= 30 }.count
        let learning = scopedProgress.filter { $0.repetitions > 0 && $0.intervalDays < 30 }.count
        let dueToday = scopedProgress.filter { $0.nextReviewDate <= endOfToday }.count

        return UserStats(total: total, mastered: mastered, learning: learning, dueToday: dueToday)
    }

    static func computeHeatmap(records: [ReviewRecord], days: Int = 30) -> [HeatmapPoint] {
        let calendar = Calendar.current
        let today = DateHelpers.startOfToday
        var counts: [String: Int] = [:]

        for record in records {
            let key = DateHelpers.dayKey(for: record.reviewedAt)
            counts[key, default: 0] += 1
        }

        var points: [HeatmapPoint] = []
        for offset in stride(from: days - 1, through: 0, by: -1) {
            guard let date = calendar.date(byAdding: .day, value: -offset, to: today) else { continue }
            let key = DateHelpers.dayKey(for: date)
            points.append(HeatmapPoint(id: key, reviewDate: key, reviewCount: counts[key, default: 0]))
        }
        return points
    }
}
