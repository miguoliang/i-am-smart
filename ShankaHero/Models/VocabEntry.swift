import Foundation

struct VocabEntry: Codable {
    let englishWord: String
    let pos: String
    let level: String
    let chineseTranslation: String

    var stableID: String {
        "\(englishWord)|\(level)|\(pos)"
    }
}
