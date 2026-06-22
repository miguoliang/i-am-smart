import Foundation
import SwiftData
import SwiftUI

@MainActor
@Observable
final class StatsViewModel {
    private let modelContext: ModelContext

    var stats = UserStats(total: 0, mastered: 0, learning: 0, dueToday: 0)
    var heatmap: [HeatmapPoint] = []
    var examTargetLabel = "KET"

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func reload() {
        do {
            let settings = try fetchSettings()
            let levels = ExamScope.levels(forExamTargetId: settings.examTargetId)
            examTargetLabel = ExamScope.pickerEntries.first {
                $0.examTargetId == settings.examTargetId
            }?.label ?? settings.examTargetId

            let knowledge = try modelContext.fetch(FetchDescriptor<KnowledgeEntry>())
            let progressList = try modelContext.fetch(FetchDescriptor<CardProgress>())
            let records = try modelContext.fetch(FetchDescriptor<ReviewRecord>())

            stats = StatsService.computeStats(
                progressList: progressList,
                levels: levels,
                knowledgeEntries: knowledge
            )
            heatmap = StatsService.computeHeatmap(records: records)
        } catch {
            stats = UserStats(total: 0, mastered: 0, learning: 0, dueToday: 0)
            heatmap = []
        }
    }

    private func fetchSettings() throws -> AppSettings {
        let descriptor = FetchDescriptor<AppSettings>()
        guard let settings = try modelContext.fetch(descriptor).first else {
            throw SettingsError.missing
        }
        return settings
    }

    enum SettingsError: Error {
        case missing
    }
}
