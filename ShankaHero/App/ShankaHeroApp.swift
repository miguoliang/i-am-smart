import SwiftData
import SwiftUI

@main
struct ShankaHeroApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            KnowledgeEntry.self,
            CardProgress.self,
            AppSettings.self,
            ReviewRecord.self,
            CoinWallet.self,
            KingdomPlot.self,
            KingdomBuilding.self,
        ])
        let configuration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            BootstrapView()
        }
        .modelContainer(sharedModelContainer)
    }
}
