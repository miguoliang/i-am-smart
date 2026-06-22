import Foundation
import SwiftData
import SwiftUI

@MainActor
@Observable
final class SettingsViewModel {
    private let modelContext: ModelContext

    var examTargetId = ExamScope.defaultExamTargetId
    var dailyDueLimit = SM2Constants.defaultDailyDueLimit
    var accent: SpeechAccent = .us

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        load()
    }

    func load() {
        do {
            let settings = try fetchSettings()
            examTargetId = settings.examTargetId
            dailyDueLimit = settings.dailyDueLimit
            accent = settings.accent
        } catch {
            return
        }
    }

    func updateExamTarget(_ entry: ExamPickerEntry) {
        examTargetId = entry.examTargetId
        persistAndReseed()
    }

    func updateDailyDueLimit(_ limit: Int) {
        dailyDueLimit = limit
        persistAndReseed()
    }

    func updateAccent(_ accent: SpeechAccent) {
        self.accent = accent
        persistAndReseed()
    }

    private func persistAndReseed() {
        do {
            let settings = try fetchSettings()
            settings.examTargetId = examTargetId
            settings.dailyDueLimit = dailyDueLimit
            settings.accent = accent
            try modelContext.save()
            try CardProgressSeeder.seedForCurrentExamScope(modelContext: modelContext)
        } catch {
            return
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
