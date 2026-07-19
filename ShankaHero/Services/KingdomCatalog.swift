import Foundation

enum KingdomCatalog {
    /// Coins awarded when the learner marks a card as remembered (quality ≥ threshold).
    static let coinsForRemembered = 5
    /// Small consolation so failed reviews still feed the economy lightly.
    static let coinsForForgotten = 1

    struct PlotBlueprint {
        let plotId: String
        let name: String
        let subtitle: String
        let unlockCost: Int
        let developCost: Int
        let sortOrder: Int
    }

    struct BuildingBlueprint {
        let buildingId: String
        let plotId: String
        let name: String
        let symbolName: String
        let unlockCost: Int
        let sortOrder: Int
    }

    static let plots: [PlotBlueprint] = [
        PlotBlueprint(
            plotId: "castle",
            name: "城堡区",
            subtitle: "一块待开垦的空地，解锁后可逐步建起城墙、王宫与花园。",
            unlockCost: 20,
            developCost: 15,
            sortOrder: 0
        ),
    ]

    static let buildings: [BuildingBlueprint] = [
        BuildingBlueprint(
            buildingId: "castle-wall",
            plotId: "castle",
            name: "城墙",
            symbolName: "shield.fill",
            unlockCost: 25,
            sortOrder: 0
        ),
        BuildingBlueprint(
            buildingId: "castle-palace",
            plotId: "castle",
            name: "王宫",
            symbolName: "building.columns.fill",
            unlockCost: 40,
            sortOrder: 1
        ),
        BuildingBlueprint(
            buildingId: "castle-garden",
            plotId: "castle",
            name: "花园",
            symbolName: "leaf.fill",
            unlockCost: 30,
            sortOrder: 2
        ),
    ]

    static func coins(forQuality quality: Int) -> Int {
        quality >= SM2Constants.qualityThreshold ? coinsForRemembered : coinsForForgotten
    }
}
