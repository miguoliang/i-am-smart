import Foundation

enum SM2Constants {
    static let defaultEaseFactor = 2.5
    static let firstInterval = 1
    static let secondInterval = 6
    static let qualityThreshold = 3
    static let minEaseFactor = 1.3
    static let easeAdjustmentBase = 0.1
    static let easeAdjustmentFactor = 0.08
    static let easeAdjustmentPenalty = 0.02
    static let maxQuality = 5
    static let defaultDailyDueLimit = 10
    static let dailyDueLimitPresets = [10, 50, 200]
}

enum DateHelpers {
    static var startOfToday: Date {
        Calendar.current.startOfDay(for: .now)
    }

    static var endOfToday: Date {
        let start = startOfToday
        return Calendar.current.date(byAdding: .day, value: 1, to: start)?.addingTimeInterval(-1) ?? .now
    }

    static func isSameDay(_ lhs: Date, _ rhs: Date) -> Bool {
        Calendar.current.isDate(lhs, inSameDayAs: rhs)
    }

    static func isToday(_ date: Date) -> Bool {
        isSameDay(date, .now)
    }

    static func dayKey(for date: Date) -> String {
        let formatter = DateFormatter()
        formatter.calendar = Calendar.current
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.string(from: date)
    }
}
