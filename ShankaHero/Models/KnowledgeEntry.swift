import Foundation
import SwiftData

@Model
final class KnowledgeEntry {
    @Attribute(.unique) var id: String
    var englishWord: String
    var level: String
    var chineseTranslation: String

    init(id: String, englishWord: String, level: String, chineseTranslation: String) {
        self.id = id
        self.englishWord = englishWord
        self.level = level
        self.chineseTranslation = chineseTranslation
    }

    convenience init(from entry: VocabEntry) {
        self.init(
            id: entry.stableID,
            englishWord: entry.englishWord,
            level: entry.level,
            chineseTranslation: entry.chineseTranslation
        )
    }
}
