import Foundation
import SwiftData
import SwiftUI

@MainActor
@Observable
final class LearnViewModel {
    private let modelContext: ModelContext

    var dueCards: [DueCardItem] = []
    var currentIndex = 0
    var answerRevealed = false
    var pendingQuality: Int?
    var brushed = 0
    var total = 0
    var reviewedToday = 0
    var dailyDueLimit = SM2Constants.defaultDailyDueLimit
    var isLoading = true
    var coinBalance = 0
    var lastCoinReward: Int?

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    var currentCard: DueCardItem? {
        guard currentIndex >= 0, currentIndex < dueCards.count else { return nil }
        return dueCards[currentIndex]
    }

    var sessionComplete: Bool {
        !isLoading && dueCards.isEmpty
    }

    func reload() {
        isLoading = true
        defer { isLoading = false }

        do {
            let settings = try fetchSettings()
            dailyDueLimit = settings.dailyDueLimit
            let levels = ExamScope.levels(forExamTargetId: settings.examTargetId)
            let knowledge = try modelContext.fetch(FetchDescriptor<KnowledgeEntry>())
            let progressList = try modelContext.fetch(FetchDescriptor<CardProgress>())
            let progressMap = Dictionary(uniqueKeysWithValues: progressList.map { ($0.knowledgeId, $0) })

            reviewedToday = DueCardService.reviewedTodayCount(progressList: progressList)
            dueCards = DueCardService.dueCards(
                knowledgeEntries: knowledge,
                progressByKnowledgeId: progressMap,
                levels: levels,
                dailyDueLimit: settings.dailyDueLimit,
                reviewedToday: reviewedToday
            )
            let progress = DueCardService.examVocabProgress(
                knowledgeEntries: knowledge,
                progressByKnowledgeId: progressMap,
                levels: levels
            )
            brushed = progress.brushed
            total = progress.total
            currentIndex = min(currentIndex, max(0, dueCards.count - 1))
            answerRevealed = false
            pendingQuality = nil
            refreshCoinBalance()
        } catch {
            dueCards = []
        }
    }

    func chooseQuality(_ quality: Int) {
        answerRevealed = true
        pendingQuality = quality
    }

    func submitNext() {
        guard let quality = pendingQuality else { return }
        submitReview(quality: quality)
    }

    func submitMisremembered() {
        submitReview(quality: 1)
    }

    private func submitReview(quality: Int) {
        guard let card = currentCard else { return }

        let input = SM2ReviewInput(
            easeFactor: card.progress.easeFactor,
            repetitions: card.progress.repetitions,
            intervalDays: card.progress.intervalDays
        )
        let result = SM2Engine.review(current: input, quality: quality)
        card.progress.easeFactor = result.easeFactor
        card.progress.repetitions = result.repetitions
        card.progress.intervalDays = result.intervalDays
        card.progress.nextReviewDate = result.nextReviewDate
        card.progress.lastReviewedAt = .now

        modelContext.insert(ReviewRecord(knowledgeId: card.knowledge.id))

        do {
            try modelContext.save()
        } catch {
            return
        }

        do {
            try KingdomService.ensureSeeded(modelContext: modelContext)
            let rewarded = try KingdomService.awardReviewCoins(quality: quality, modelContext: modelContext)
            lastCoinReward = rewarded
            coinBalance = try KingdomService.walletBalance(modelContext: modelContext)
        } catch {
            lastCoinReward = nil
        }

        dueCards.remove(at: currentIndex)
        if currentIndex >= dueCards.count {
            currentIndex = max(0, dueCards.count - 1)
        }
        answerRevealed = false
        pendingQuality = nil
        reviewedToday += 1

        if dueCards.isEmpty {
            reload()
        } else {
            refreshProgressCounts()
        }
    }

    private func refreshCoinBalance() {
        do {
            try KingdomService.ensureSeeded(modelContext: modelContext)
            coinBalance = try KingdomService.walletBalance(modelContext: modelContext)
        } catch {
            coinBalance = 0
        }
    }

    private func refreshProgressCounts() {
        do {
            let settings = try fetchSettings()
            let levels = ExamScope.levels(forExamTargetId: settings.examTargetId)
            let knowledge = try modelContext.fetch(FetchDescriptor<KnowledgeEntry>())
            let progressList = try modelContext.fetch(FetchDescriptor<CardProgress>())
            let progressMap = Dictionary(uniqueKeysWithValues: progressList.map { ($0.knowledgeId, $0) })
            let progress = DueCardService.examVocabProgress(
                knowledgeEntries: knowledge,
                progressByKnowledgeId: progressMap,
                levels: levels
            )
            brushed = progress.brushed
            total = progress.total
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
