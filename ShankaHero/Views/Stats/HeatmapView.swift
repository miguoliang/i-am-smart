import SwiftUI

struct HeatmapView: View {
    let points: [HeatmapPoint]

    private var maxCount: Int {
        max(points.map(\.reviewCount).max() ?? 1, 1)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("近 30 天复习")
                .font(.headline)

            HStack(alignment: .bottom, spacing: 4) {
                ForEach(points) { point in
                    VStack(spacing: 4) {
                        RoundedRectangle(cornerRadius: 3)
                            .fill(color(for: point.reviewCount))
                            .frame(width: 8, height: barHeight(for: point.reviewCount))
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }

    private func barHeight(for count: Int) -> CGFloat {
        let normalized = CGFloat(count) / CGFloat(maxCount)
        return max(4, normalized * 64)
    }

    private func color(for count: Int) -> Color {
        if count == 0 { return Color(.systemGray5) }
        let intensity = Double(count) / Double(maxCount)
        return Color.green.opacity(0.3 + intensity * 0.7)
    }
}
