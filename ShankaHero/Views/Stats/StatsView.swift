import SwiftData
import SwiftUI

struct StatsView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: StatsViewModel?

    var body: some View {
        NavigationStack {
            Group {
                if let viewModel {
                    ScrollView {
                        VStack(spacing: 24) {
                            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
                                StatTile(title: "总词量", value: viewModel.stats.total, color: .blue)
                                StatTile(title: "已掌握", value: viewModel.stats.mastered, color: .green)
                                StatTile(title: "学习中", value: viewModel.stats.learning, color: .orange)
                                StatTile(title: "今日待复习", value: viewModel.stats.dueToday, color: .red)
                            }

                            if viewModel.stats.total > 0 {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("\(viewModel.examTargetLabel) 完成进度")
                                        .font(.headline)
                                    ProgressView(
                                        value: Double(viewModel.stats.mastered),
                                        total: Double(max(viewModel.stats.total, 1))
                                    )
                                    .tint(.green)
                                    Text("已掌握 \(viewModel.stats.mastered) / 总共 \(viewModel.stats.total) 词")
                                        .font(.subheadline)
                                        .foregroundStyle(.secondary)
                                }
                                .padding()
                                .background(
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(Color(.secondarySystemGroupedBackground))
                                )
                            }

                            HeatmapView(points: viewModel.heatmap)
                                .padding()
                                .background(
                                    RoundedRectangle(cornerRadius: 16)
                                        .fill(Color(.secondarySystemGroupedBackground))
                                )
                        }
                        .padding()
                    }
                } else {
                    ProgressView()
                }
            }
            .navigationTitle("统计")
            .background(Color(.systemGroupedBackground))
        }
        .onAppear {
            if viewModel == nil {
                viewModel = StatsViewModel(modelContext: modelContext)
            }
            viewModel?.reload()
        }
    }
}

private struct StatTile: View {
    let title: String
    let value: Int
    let color: Color

    var body: some View {
        VStack(spacing: 8) {
            Text("\(value)")
                .font(.system(size: 36, weight: .bold, design: .rounded))
            Text(title)
                .font(.subheadline)
        }
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 24)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(color)
        )
    }
}
