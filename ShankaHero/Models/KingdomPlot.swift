import Foundation
import SwiftData

@Model
final class KingdomPlot {
    @Attribute(.unique) var plotId: String
    var name: String
    var subtitle: String
    var unlockCost: Int
    var developCost: Int
    var sortOrder: Int
    var isUnlocked: Bool
    var isDeveloped: Bool

    init(
        plotId: String,
        name: String,
        subtitle: String,
        unlockCost: Int,
        developCost: Int,
        sortOrder: Int,
        isUnlocked: Bool = false,
        isDeveloped: Bool = false
    ) {
        self.plotId = plotId
        self.name = name
        self.subtitle = subtitle
        self.unlockCost = unlockCost
        self.developCost = developCost
        self.sortOrder = sortOrder
        self.isUnlocked = isUnlocked
        self.isDeveloped = isDeveloped
    }
}
