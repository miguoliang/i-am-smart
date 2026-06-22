import SwiftData
import SwiftUI

struct BootstrapView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var isReady = false
    @State private var errorMessage: String?

    var body: some View {
        Group {
            if isReady {
                MainTabView()
            } else if let errorMessage {
                VStack(spacing: 16) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.largeTitle)
                        .foregroundStyle(.orange)
                    Text("加载失败")
                        .font(.title2.bold())
                    Text(errorMessage)
                        .font(.body)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(.secondary)
                }
                .padding()
            } else {
                VStack(spacing: 20) {
                    ProgressView()
                        .controlSize(.large)
                    Text("正在加载词库…")
                        .font(.headline)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .task {
            await bootstrap()
        }
    }

    @MainActor
    private func bootstrap() async {
        do {
            try await Task.detached(priority: .userInitiated) {
                try await MainActor.run {
                    try AppBootstrap.run(modelContext: modelContext)
                }
            }.value
            isReady = true
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
