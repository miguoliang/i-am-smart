import SwiftData
import SwiftUI

struct KingdomView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: KingdomViewModel?

    var body: some View {
        NavigationStack {
            Group {
                if let viewModel {
                    kingdomContent(viewModel: viewModel)
                } else {
                    ProgressView()
                }
            }
            .navigationTitle("王国")
            .background(Color(.systemGroupedBackground))
            .alert("提示", isPresented: errorBinding) {
                Button("好的", role: .cancel) {
                    viewModel?.errorMessage = nil
                }
            } message: {
                Text(viewModel?.errorMessage ?? "")
            }
        }
        .onAppear {
            if viewModel == nil {
                viewModel = KingdomViewModel(modelContext: modelContext)
            }
            viewModel?.reload()
        }
    }

    private var errorBinding: Binding<Bool> {
        Binding(
            get: { viewModel?.errorMessage != nil },
            set: { isPresented in
                if !isPresented {
                    viewModel?.errorMessage = nil
                }
            }
        )
    }

    @ViewBuilder
    private func kingdomContent(viewModel: KingdomViewModel) -> some View {
        if viewModel.isLoading {
            ProgressView("加载王国…")
        } else {
            ScrollView {
                VStack(spacing: 20) {
                    coinBanner(balance: viewModel.balance)

                    if let message = viewModel.lastActionMessage {
                        Text(message)
                            .font(.subheadline.weight(.medium))
                            .foregroundStyle(.green)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .transition(.opacity.combined(with: .move(edge: .top)))
                    }

                    Text("记单词赚金币，解锁并建设你的城堡区。")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)

                    ForEach(viewModel.plots, id: \.plotId) { plot in
                        PlotCard(
                            plot: plot,
                            buildings: viewModel.buildings(for: plot),
                            balance: viewModel.balance,
                            onUnlock: { viewModel.unlockPlot(plot) },
                            onDevelop: { viewModel.developPlot(plot) },
                            onUnlockBuilding: { viewModel.unlockBuilding($0) }
                        )
                    }
                }
                .padding()
                .animation(.easeInOut(duration: 0.25), value: viewModel.lastActionMessage)
            }
        }
    }

    private func coinBanner(balance: Int) -> some View {
        HStack(spacing: 12) {
            Image(systemName: "bitcoinsign.circle.fill")
                .font(.system(size: 36))
                .foregroundStyle(.yellow)
                .symbolEffect(.bounce, value: balance)
            VStack(alignment: .leading, spacing: 4) {
                Text("金币")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text("\(balance)")
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .contentTransition(.numericText())
            }
            Spacer()
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Color(.secondarySystemGroupedBackground))
        )
    }
}

private struct PlotCard: View {
    let plot: KingdomPlot
    let buildings: [KingdomBuilding]
    let balance: Int
    let onUnlock: () -> Void
    let onDevelop: () -> Void
    let onUnlockBuilding: (KingdomBuilding) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 6) {
                    Text(plot.name)
                        .font(.title3.bold())
                    Text(statusLabel)
                        .font(.caption.weight(.semibold))
                        .foregroundStyle(statusColor)
                    Text(plot.subtitle)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: plotIcon)
                    .font(.system(size: 40))
                    .foregroundStyle(plot.isDeveloped ? .indigo : .secondary)
                    .symbolEffect(.bounce, value: plot.isDeveloped)
            }

            PlotScenePreview(plot: plot, buildings: buildings)
                .frame(height: 140)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))

            actionButtons
            buildingList
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Color(.secondarySystemGroupedBackground))
        )
    }

    private var statusLabel: String {
        if !plot.isUnlocked { return "未解锁空地" }
        if !plot.isDeveloped { return "已解锁 · 待开发" }
        return "已开发 · 可建造"
    }

    private var statusColor: Color {
        if !plot.isUnlocked { return .secondary }
        if !plot.isDeveloped { return .orange }
        return .green
    }

    private var plotIcon: String {
        if !plot.isUnlocked { return "lock.fill" }
        if !plot.isDeveloped { return "mountain.2.fill" }
        return "crown.fill"
    }

    @ViewBuilder
    private var actionButtons: some View {
        if !plot.isUnlocked {
            Button {
                onUnlock()
            } label: {
                Label("解锁空地 · \(plot.unlockCost) 金币", systemImage: "lock.open.fill")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .disabled(balance < plot.unlockCost)
        } else if !plot.isDeveloped {
            Button {
                onDevelop()
            } label: {
                Label("开发土地 · \(plot.developCost) 金币", systemImage: "hammer.fill")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
            }
            .buttonStyle(.borderedProminent)
            .tint(.orange)
            .disabled(balance < plot.developCost)
        }
    }

    @ViewBuilder
    private var buildingList: some View {
        if plot.isDeveloped {
            VStack(spacing: 10) {
                ForEach(buildings, id: \.buildingId) { building in
                    HStack(spacing: 12) {
                        Image(systemName: building.symbolName)
                            .font(.title3)
                            .foregroundStyle(building.isUnlocked ? .indigo : .secondary)
                            .frame(width: 28)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(building.name)
                                .font(.headline)
                            Text(building.isUnlocked ? "已建成" : "消耗 \(building.unlockCost) 金币")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        if building.isUnlocked {
                            Image(systemName: "checkmark.circle.fill")
                                .foregroundStyle(.green)
                                .symbolEffect(.bounce, value: building.isUnlocked)
                        } else {
                            Button("建造") {
                                onUnlockBuilding(building)
                            }
                            .buttonStyle(.bordered)
                            .disabled(balance < building.unlockCost)
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
        }
    }
}

/// Lightweight scenic preview for MVP — SwiftUI only; SpriteKit can replace later.
private struct PlotScenePreview: View {
    let plot: KingdomPlot
    let buildings: [KingdomBuilding]

    private var wallUnlocked: Bool {
        buildings.first(where: { $0.buildingId == "castle-wall" })?.isUnlocked == true
    }

    private var palaceUnlocked: Bool {
        buildings.first(where: { $0.buildingId == "castle-palace" })?.isUnlocked == true
    }

    private var gardenUnlocked: Bool {
        buildings.first(where: { $0.buildingId == "castle-garden" })?.isUnlocked == true
    }

    var body: some View {
        ZStack {
            LinearGradient(
                colors: plot.isUnlocked
                    ? [Color.green.opacity(0.35), Color.mint.opacity(0.45)]
                    : [Color.gray.opacity(0.25), Color.gray.opacity(0.4)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            if !plot.isUnlocked {
                VStack(spacing: 8) {
                    Image(systemName: "lock.fill")
                        .font(.largeTitle)
                    Text("空地未解锁")
                        .font(.caption.weight(.semibold))
                }
                .foregroundStyle(.secondary)
            } else if !plot.isDeveloped {
                VStack(spacing: 8) {
                    Image(systemName: "mountain.2.fill")
                        .font(.largeTitle)
                    Text("荒地 · 等待开发")
                        .font(.caption.weight(.semibold))
                }
                .foregroundStyle(.secondary)
            } else {
                HStack(spacing: 18) {
                    scenePiece(unlocked: wallUnlocked, symbol: "shield.fill", label: "城墙")
                    scenePiece(unlocked: palaceUnlocked, symbol: "building.columns.fill", label: "王宫")
                    scenePiece(unlocked: gardenUnlocked, symbol: "leaf.fill", label: "花园")
                }
                .padding(.horizontal)
            }
        }
        .animation(.spring(response: 0.45, dampingFraction: 0.8), value: plot.isUnlocked)
        .animation(.spring(response: 0.45, dampingFraction: 0.8), value: plot.isDeveloped)
        .animation(.spring(response: 0.45, dampingFraction: 0.8), value: wallUnlocked)
        .animation(.spring(response: 0.45, dampingFraction: 0.8), value: palaceUnlocked)
        .animation(.spring(response: 0.45, dampingFraction: 0.8), value: gardenUnlocked)
    }

    private func scenePiece(unlocked: Bool, symbol: String, label: String) -> some View {
        VStack(spacing: 6) {
            Image(systemName: symbol)
                .font(.system(size: unlocked ? 34 : 26))
                .foregroundStyle(unlocked ? .primary : .secondary.opacity(0.45))
                .scaleEffect(unlocked ? 1 : 0.85)
                .opacity(unlocked ? 1 : 0.45)
            Text(label)
                .font(.caption2.weight(.medium))
                .foregroundStyle(unlocked ? .primary : .secondary)
        }
        .frame(maxWidth: .infinity)
    }
}
