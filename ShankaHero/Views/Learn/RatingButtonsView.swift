import SwiftUI

struct RatingButtonsView: View {
    let onChoose: (Int) -> Void

    var body: some View {
        HStack(spacing: 16) {
            Button {
                onChoose(1)
            } label: {
                Text("不会 ✗")
                    .font(.title2.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
            }
            .buttonStyle(RatingButtonStyle(tint: .red))

            Button {
                onChoose(4)
            } label: {
                Text("会了 ✓")
                    .font(.title2.bold())
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 20)
            }
            .buttonStyle(RatingButtonStyle(tint: .green))
        }
    }
}

private struct RatingButtonStyle: ButtonStyle {
    let tint: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .foregroundStyle(.white)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(tint.opacity(configuration.isPressed ? 0.85 : 1))
            )
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
    }
}
