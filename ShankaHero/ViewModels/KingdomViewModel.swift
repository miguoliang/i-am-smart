import Foundation
import SwiftData
import SwiftUI

@MainActor
@Observable
final class KingdomViewModel {
    private let modelContext: ModelContext

    var balance = 0
    var plots: [KingdomPlot] = []
    var buildingsByPlot: [String: [KingdomBuilding]] = [:]
    var errorMessage: String?
    var isLoading = true
    var lastActionMessage: String?

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
    }

    func reload() {
        isLoading = true
        defer { isLoading = false }
        do {
            try KingdomService.ensureSeeded(modelContext: modelContext)
            balance = try KingdomService.walletBalance(modelContext: modelContext)

            let plotDescriptor = FetchDescriptor<KingdomPlot>(
                sortBy: [SortDescriptor(\.sortOrder)]
            )
            plots = try modelContext.fetch(plotDescriptor)

            let buildingDescriptor = FetchDescriptor<KingdomBuilding>(
                sortBy: [SortDescriptor(\.sortOrder)]
            )
            let buildings = try modelContext.fetch(buildingDescriptor)
            buildingsByPlot = Dictionary(grouping: buildings, by: \.plotId)
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func unlockPlot(_ plot: KingdomPlot) {
        perform {
            try KingdomService.unlockPlot(plotId: plot.plotId, modelContext: modelContext)
            lastActionMessage = "已解锁「\(plot.name)」"
        }
    }

    func developPlot(_ plot: KingdomPlot) {
        perform {
            try KingdomService.developPlot(plotId: plot.plotId, modelContext: modelContext)
            lastActionMessage = "「\(plot.name)」开发完成，可以开始建造了"
        }
    }

    func unlockBuilding(_ building: KingdomBuilding) {
        perform {
            try KingdomService.unlockBuilding(buildingId: building.buildingId, modelContext: modelContext)
            lastActionMessage = "已建起「\(building.name)」"
        }
    }

    func buildings(for plot: KingdomPlot) -> [KingdomBuilding] {
        buildingsByPlot[plot.plotId] ?? []
    }

    private func perform(_ action: () throws -> Void) {
        do {
            try action()
            reload()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
