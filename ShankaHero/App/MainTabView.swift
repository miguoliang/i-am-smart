import SwiftUI

struct MainTabView: View {
    var body: some View {
        TabView {
            LearnView()
                .tabItem {
                    Label("学习", systemImage: "book.fill")
                }

            StatsView()
                .tabItem {
                    Label("统计", systemImage: "chart.bar.fill")
                }

            SettingsView()
                .tabItem {
                    Label("设置", systemImage: "gearshape.fill")
                }
        }
    }
}
