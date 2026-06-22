import XCTest
@testable import ShankaHero

final class DueCardServiceTests: XCTestCase {
    func testDueCardsRespectDailyLimit() {
        let entries = (0..<5).map { index in
            KnowledgeEntry(from: VocabEntry(
                englishWord: "word\(index)",
                pos: "n.",
                level: "A1",
                chineseTranslation: "测试"
            ))
        }
        let progress = entries.map { CardProgress(knowledgeId: $0.id, nextReviewDate: DateHelpers.startOfToday) }
        let progressMap = Dictionary(uniqueKeysWithValues: progress.map { ($0.knowledgeId, $0) })

        let due = DueCardService.dueCards(
            knowledgeEntries: entries,
            progressByKnowledgeId: progressMap,
            levels: ["A1"],
            dailyDueLimit: 2,
            reviewedToday: 0
        )

        XCTAssertEqual(due.count, 2)
    }

    func testDueCardsExcludeAlreadyReviewedToday() {
        let entry = KnowledgeEntry(from: VocabEntry(
            englishWord: "hello",
            pos: "interj.",
            level: "A1",
            chineseTranslation: "你好"
        ))
        let progress = CardProgress(
            knowledgeId: entry.id,
            nextReviewDate: DateHelpers.startOfToday,
            lastReviewedAt: .now
        )

        let due = DueCardService.dueCards(
            knowledgeEntries: [entry],
            progressByKnowledgeId: [entry.id: progress],
            levels: ["A1"],
            dailyDueLimit: 10,
            reviewedToday: 1
        )

        XCTAssertTrue(due.isEmpty)
    }

    func testExamVocabProgressCountsBrushedWords() {
        let entry = KnowledgeEntry(from: VocabEntry(
            englishWord: "cat",
            pos: "n.",
            level: "A1",
            chineseTranslation: "猫"
        ))
        let brushed = CardProgress(knowledgeId: entry.id, repetitions: 1)
        let fresh = CardProgress(knowledgeId: "other|A1|n.", repetitions: 0)

        let progress = DueCardService.examVocabProgress(
            knowledgeEntries: [entry],
            progressByKnowledgeId: [entry.id: brushed, "other|A1|n.": fresh],
            levels: ["A1"]
        )

        XCTAssertEqual(progress.total, 1)
        XCTAssertEqual(progress.brushed, 1)
    }
}
