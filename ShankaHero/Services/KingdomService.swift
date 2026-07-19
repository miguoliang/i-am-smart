import Foundation
import SwiftData

enum KingdomSpendError: LocalizedError, Equatable {
    case missingWallet
    case missingPlot
    case missingBuilding
    case insufficientCoins(need: Int, have: Int)
    case alreadyUnlocked
    case plotLocked
    case plotNotDeveloped
    case alreadyDeveloped

    var errorDescription: String? {
        switch self {
        case .missingWallet:
            "尚未初始化金币账户"
        case .missingPlot:
            "找不到这块土地"
        case .missingBuilding:
            "找不到这座建筑"
        case let .insufficientCoins(need, have):
            "金币不足（需要 \(need)，当前 \(have)）"
        case .alreadyUnlocked:
            "已经解锁过了"
        case .plotLocked:
            "请先解锁这块土地"
        case .plotNotDeveloped:
            "请先开发这块土地"
        case .alreadyDeveloped:
            "这块土地已经开发过了"
        }
    }
}

@MainActor
enum KingdomService {
    static func ensureSeeded(modelContext: ModelContext) throws {
        if try fetchWallet(modelContext: modelContext) == nil {
            modelContext.insert(CoinWallet())
        }

        let existingPlots = try modelContext.fetch(FetchDescriptor<KingdomPlot>())
        let plotIds = Set(existingPlots.map(\.plotId))
        for blueprint in KingdomCatalog.plots where !plotIds.contains(blueprint.plotId) {
            modelContext.insert(
                KingdomPlot(
                    plotId: blueprint.plotId,
                    name: blueprint.name,
                    subtitle: blueprint.subtitle,
                    unlockCost: blueprint.unlockCost,
                    developCost: blueprint.developCost,
                    sortOrder: blueprint.sortOrder
                )
            )
        }

        let existingBuildings = try modelContext.fetch(FetchDescriptor<KingdomBuilding>())
        let buildingIds = Set(existingBuildings.map(\.buildingId))
        for blueprint in KingdomCatalog.buildings where !buildingIds.contains(blueprint.buildingId) {
            modelContext.insert(
                KingdomBuilding(
                    buildingId: blueprint.buildingId,
                    plotId: blueprint.plotId,
                    name: blueprint.name,
                    symbolName: blueprint.symbolName,
                    unlockCost: blueprint.unlockCost,
                    sortOrder: blueprint.sortOrder
                )
            )
        }

        try modelContext.save()
    }

    @discardableResult
    static func awardReviewCoins(quality: Int, modelContext: ModelContext) throws -> Int {
        let amount = KingdomCatalog.coins(forQuality: quality)
        guard amount > 0 else { return 0 }
        let wallet = try requireWallet(modelContext: modelContext)
        wallet.balance += amount
        try modelContext.save()
        return amount
    }

    static func unlockPlot(plotId: String, modelContext: ModelContext) throws {
        let plot = try requirePlot(plotId: plotId, modelContext: modelContext)
        guard !plot.isUnlocked else { throw KingdomSpendError.alreadyUnlocked }
        try spend(plot.unlockCost, modelContext: modelContext)
        plot.isUnlocked = true
        try modelContext.save()
    }

    static func developPlot(plotId: String, modelContext: ModelContext) throws {
        let plot = try requirePlot(plotId: plotId, modelContext: modelContext)
        guard plot.isUnlocked else { throw KingdomSpendError.plotLocked }
        guard !plot.isDeveloped else { throw KingdomSpendError.alreadyDeveloped }
        try spend(plot.developCost, modelContext: modelContext)
        plot.isDeveloped = true
        try modelContext.save()
    }

    static func unlockBuilding(buildingId: String, modelContext: ModelContext) throws {
        let building = try requireBuilding(buildingId: buildingId, modelContext: modelContext)
        guard !building.isUnlocked else { throw KingdomSpendError.alreadyUnlocked }
        let plot = try requirePlot(plotId: building.plotId, modelContext: modelContext)
        guard plot.isUnlocked else { throw KingdomSpendError.plotLocked }
        guard plot.isDeveloped else { throw KingdomSpendError.plotNotDeveloped }
        try spend(building.unlockCost, modelContext: modelContext)
        building.isUnlocked = true
        try modelContext.save()
    }

    static func walletBalance(modelContext: ModelContext) throws -> Int {
        try requireWallet(modelContext: modelContext).balance
    }

    private static func spend(_ cost: Int, modelContext: ModelContext) throws {
        let wallet = try requireWallet(modelContext: modelContext)
        guard wallet.balance >= cost else {
            throw KingdomSpendError.insufficientCoins(need: cost, have: wallet.balance)
        }
        wallet.balance -= cost
    }

    private static func fetchWallet(modelContext: ModelContext) throws -> CoinWallet? {
        try modelContext.fetch(FetchDescriptor<CoinWallet>()).first
    }

    private static func requireWallet(modelContext: ModelContext) throws -> CoinWallet {
        guard let wallet = try fetchWallet(modelContext: modelContext) else {
            throw KingdomSpendError.missingWallet
        }
        return wallet
    }

    private static func requirePlot(plotId: String, modelContext: ModelContext) throws -> KingdomPlot {
        var descriptor = FetchDescriptor<KingdomPlot>(
            predicate: #Predicate { $0.plotId == plotId }
        )
        descriptor.fetchLimit = 1
        guard let plot = try modelContext.fetch(descriptor).first else {
            throw KingdomSpendError.missingPlot
        }
        return plot
    }

    private static func requireBuilding(buildingId: String, modelContext: ModelContext) throws -> KingdomBuilding {
        var descriptor = FetchDescriptor<KingdomBuilding>(
            predicate: #Predicate { $0.buildingId == buildingId }
        )
        descriptor.fetchLimit = 1
        guard let building = try modelContext.fetch(descriptor).first else {
            throw KingdomSpendError.missingBuilding
        }
        return building
    }
}
