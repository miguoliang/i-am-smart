import Foundation

enum ExamWordScope: String, CaseIterable {
    case ket
    case throughB2
    case throughC1
    case throughC2

    var levels: [String] {
        switch self {
        case .ket: ["A1", "A2"]
        case .throughB2: ["A1", "A2", "B1", "B2"]
        case .throughC1: ["A1", "A2", "B1", "B2", "C1"]
        case .throughC2: ["A1", "A2", "B1", "B2", "C1", "C2"]
        }
    }
}

struct ExamPickerEntry: Identifiable {
    let scope: ExamWordScope
    let label: String
    let examTargetId: String

    var id: String { scope.rawValue }
}

enum ExamScope {
    static let defaultExamTargetId = "ket"

    static let pickerEntries: [ExamPickerEntry] = [
        ExamPickerEntry(scope: .ket, label: "KET", examTargetId: "ket"),
        ExamPickerEntry(scope: .throughB2, label: "PET/四级", examTargetId: "pet"),
        ExamPickerEntry(scope: .throughC1, label: "六级", examTargetId: "cet6"),
        ExamPickerEntry(scope: .throughC2, label: "雅思/托福", examTargetId: "ielts"),
    ]

    static func levels(forExamTargetId examTargetId: String) -> [String] {
        scope(forExamTargetId: examTargetId).levels
    }

    static func scope(forExamTargetId examTargetId: String) -> ExamWordScope {
        pickerEntries.first { $0.examTargetId == examTargetId }?.scope ?? .ket
    }
}
