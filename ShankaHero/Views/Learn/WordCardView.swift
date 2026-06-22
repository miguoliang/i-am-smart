import SwiftUI

struct WordCardView: View {
    let englishWord: String
    let chineseTranslation: String
    let answerRevealed: Bool

    var body: some View {
        VStack(spacing: 0) {
            Text(englishWord)
                .font(.system(size: 44, weight: .bold, design: .rounded))
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.5)
                .lineLimit(3)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 32)

            Divider()
                .padding(.horizontal, 8)

            ZStack {
                Text(chineseTranslation)
                    .font(.system(size: 32, weight: .bold))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(.primary)
                    .opacity(answerRevealed ? 1 : 0)

                if !answerRevealed {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(.systemGray5))
                        .frame(height: 40)
                        .padding(.horizontal, 24)
                }
            }
            .frame(minHeight: 80)
            .padding(.vertical, 24)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 24, style: .continuous)
                .fill(Color(.secondarySystemGroupedBackground))
                .shadow(color: .black.opacity(0.08), radius: 16, y: 8)
        )
    }
}
