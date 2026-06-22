import SwiftUI

struct ExamVocabProgressLabel: View {
    let brushed: Int
    let total: Int

    var body: some View {
        Text("\(brushed)/\(total)")
            .font(.caption.monospacedDigit())
            .foregroundStyle(.secondary)
            .accessibilityLabel("已刷 \(brushed)，共 \(total) 词")
    }
}
