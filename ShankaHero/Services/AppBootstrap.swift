import Foundation
import SwiftData

@MainActor
enum AppBootstrap {
    static func run(modelContext: ModelContext) throws {
        try VocabularyImporter.importIfNeeded(modelContext: modelContext)
        try CardProgressSeeder.seedForCurrentExamScope(modelContext: modelContext)
    }
}
