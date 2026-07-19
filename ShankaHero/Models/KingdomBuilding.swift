import Foundation
import SwiftData

@Model
final class KingdomBuilding {
    @Attribute(.unique) var buildingId: String
    var plotId: String
    var name: String
    var symbolName: String
    var unlockCost: Int
    var sortOrder: Int
    var isUnlocked: Bool

    init(
        buildingId: String,
        plotId: String,
        name: String,
        symbolName: String,
        unlockCost: Int,
        sortOrder: Int,
        isUnlocked: Bool = false
    ) {
        self.buildingId = buildingId
        self.plotId = plotId
        self.name = name
        self.symbolName = symbolName
        self.unlockCost = unlockCost
        self.sortOrder = sortOrder
        self.isUnlocked = isUnlocked
    }
}
