import SwiftUI

struct LearnEmptyStateView: View {
    let reviewedToday: Int
    let dailyDueLimit: Int

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.seal.fill")
                .font(.system(size: 56))
                .foregroundStyle(.green)
            Text("今日复习完成")
                .font(.title.bold())
            Text("已完成 \(reviewedToday) / \(dailyDueLimit) 张，明天再来继续吧。")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(32)
    }
}
