import SwiftData
import XCTest
@testable import ShankaHero

@MainActor
final class KingdomServiceTests: XCTestCase {
    private var container: ModelContainer!
    private var context: ModelContext!

    override func setUpWithError() throws {
        let schema = Schema([
            CoinWallet.self,
            KingdomPlot.self,
            KingdomBuilding.self,
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: true)
        container = try ModelContainer(for: schema, configurations: [configuration])
        context = ModelContext(container)
        try KingdomService.ensureSeeded(modelContext: context)
    }

    func testCoinsForRememberedAndForgotten() {
        XCTAssertEqual(KingdomCatalog.coins(forQuality: 4), KingdomCatalog.coinsForRemembered)
        XCTAssertEqual(KingdomCatalog.coins(forQuality: 1), KingdomCatalog.coinsForForgotten)
    }

    func testAwardReviewCoinsIncreasesBalance() throws {
        let gained = try KingdomService.awardReviewCoins(quality: 4, modelContext: context)
        XCTAssertEqual(gained, KingdomCatalog.coinsForRemembered)
        XCTAssertEqual(try KingdomService.walletBalance(modelContext: context), KingdomCatalog.coinsForRemembered)
    }

    func testUnlockDevelopAndBuildCastleFlow() throws {
        // Earn enough coins for unlock (20) + develop (15) + wall (25) = 60
        for _ in 0..<12 {
            _ = try KingdomService.awardReviewCoins(quality: 4, modelContext: context)
        }

        try KingdomService.unlockPlot(plotId: "castle", modelContext: context)
        try KingdomService.developPlot(plotId: "castle", modelContext: context)
        try KingdomService.unlockBuilding(buildingId: "castle-wall", modelContext: context)

        let plot = try context.fetch(FetchDescriptor<KingdomPlot>()).first { $0.plotId == "castle" }
        let wall = try context.fetch(FetchDescriptor<KingdomBuilding>()).first { $0.buildingId == "castle-wall" }

        XCTAssertEqual(plot?.isUnlocked, true)
        XCTAssertEqual(plot?.isDeveloped, true)
        XCTAssertEqual(wall?.isUnlocked, true)
        XCTAssertEqual(try KingdomService.walletBalance(modelContext: context), 0)
    }

    func testUnlockPlotFailsWhenBroke() {
        XCTAssertThrowsError(try KingdomService.unlockPlot(plotId: "castle", modelContext: context)) { error in
            XCTAssertEqual(error as? KingdomSpendError, .insufficientCoins(need: 20, have: 0))
        }
    }
}
