import Foundation
import SwiftData

enum CardProgressSeeder {
    @MainActor
    static func seedForCurrentExamScope(modelContext: ModelContext) throws {
        let settings = try fetchSettings(modelContext: modelContext)
        let levels = Set(ExamScope.levels(forExamTargetId: settings.examTargetId))
        let knowledge = try modelContext.fetch(FetchDescriptor<KnowledgeEntry>())
        let existingProgress = try modelContext.fetch(FetchDescriptor<CardProgress>())
        let existingIDs = Set(existingProgress.map(\.knowledgeId))

        for entry in knowledge where levels.contains(entry.level) && !existingIDs.contains(entry.id) {
            modelContext.insert(CardProgress(knowledgeId: entry.id))
        }
        try modelContext.save()
    }

    @MainActor
    private static func fetchSettings(modelContext: ModelContext) throws -> AppSettings {
        let descriptor = FetchDescriptor<AppSettings>()
        guard let settings = try modelContext.fetch(descriptor).first else {
            throw SeederError.missingSettings
        }
        return settings
    }

    enum SeederError: LocalizedError {
        case missingSettings

        var errorDescription: String? {
            switch self {
            case .missingSettings:
                "App settings not initialized"
            }
        }
    }
}
