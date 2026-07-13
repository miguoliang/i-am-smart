import Foundation
import SwiftData

enum VocabularyImporter {
    private static let dataFiles = [
        "cefr-a1",
        "cefr-a2",
        "cefr-a2-ext",
        "cefr-b1",
        "cefr-b2",
        "cefr-c1",
        "cefr-c2",
    ]

    static func loadBundledEntries() throws -> [VocabEntry] {
        var all: [VocabEntry] = []
        let decoder = JSONDecoder()

        for name in dataFiles {
            guard let url = Bundle.main.url(forResource: name, withExtension: "json", subdirectory: "Vocabulary")
                ?? Bundle.main.url(forResource: name, withExtension: "json") else {
                throw ImportError.missingFile(name)
            }
            let data = try Data(contentsOf: url)
            let entries = try decoder.decode([VocabEntry].self, from: data)
            all.append(contentsOf: entries)
        }
        return all
    }

    @MainActor
    static func importIfNeeded(modelContext: ModelContext) throws {
        let settings = try fetchOrCreateSettings(modelContext: modelContext)
        let entries = try loadBundledEntries()
        let existing = try modelContext.fetch(FetchDescriptor<KnowledgeEntry>())
        let existingIDs = Set(existing.map(\.id))

        var inserted = false
        for entry in entries where !existingIDs.contains(entry.stableID) {
            modelContext.insert(KnowledgeEntry(from: entry))
            inserted = true
        }

        // Always merge missing lemmas (e.g. a2-ext) even after the first import.
        if inserted || !settings.vocabularyImported {
            settings.vocabularyImported = true
            try modelContext.save()
        }
    }

    @MainActor
    private static func fetchOrCreateSettings(modelContext: ModelContext) throws -> AppSettings {
        let descriptor = FetchDescriptor<AppSettings>()
        if let settings = try modelContext.fetch(descriptor).first {
            return settings
        }
        let settings = AppSettings()
        modelContext.insert(settings)
        try modelContext.save()
        return settings
    }

    enum ImportError: LocalizedError {
        case missingFile(String)

        var errorDescription: String? {
            switch self {
            case .missingFile(let name):
                "Missing vocabulary file: \(name).json"
            }
        }
    }
}
