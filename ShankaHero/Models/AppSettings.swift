import Foundation
import SwiftData

enum SpeechAccent: String, CaseIterable, Identifiable {
    case us = "en-US"
    case uk = "en-GB"

    var id: String { rawValue }

    var label: String {
        switch self {
        case .us: "美音"
        case .uk: "英音"
        }
    }
}

@Model
final class AppSettings {
    static let singletonID = "app-settings"

    @Attribute(.unique) var id: String
    var examTargetId: String
    var dailyDueLimit: Int
    var accentRaw: String
    var vocabularyImported: Bool

    var accent: SpeechAccent {
        get { SpeechAccent(rawValue: accentRaw) ?? .us }
        set { accentRaw = newValue.rawValue }
    }

    init(
        id: String = AppSettings.singletonID,
        examTargetId: String = ExamScope.defaultExamTargetId,
        dailyDueLimit: Int = SM2Constants.defaultDailyDueLimit,
        accentRaw: String = SpeechAccent.us.rawValue,
        vocabularyImported: Bool = false
    ) {
        self.id = id
        self.examTargetId = examTargetId
        self.dailyDueLimit = dailyDueLimit
        self.accentRaw = accentRaw
        self.vocabularyImported = vocabularyImported
    }
}
