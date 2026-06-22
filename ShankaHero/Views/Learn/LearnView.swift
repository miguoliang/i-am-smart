import SwiftData
import SwiftUI

struct LearnView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: LearnViewModel?
    @State private var accent: SpeechAccent = .us

    var body: some View {
        NavigationStack {
            Group {
                if let viewModel {
                    learnContent(viewModel: viewModel)
                } else {
                    ProgressView()
                }
            }
            .navigationTitle("闪卡英雄")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    if let viewModel {
                        ExamVocabProgressLabel(brushed: viewModel.brushed, total: viewModel.total)
                    }
                }
            }
        }
        .onAppear {
            if viewModel == nil {
                viewModel = LearnViewModel(modelContext: modelContext)
            }
            loadAccent()
            viewModel?.reload()
        }
    }

    @ViewBuilder
    private func learnContent(viewModel: LearnViewModel) -> some View {
        if viewModel.isLoading {
            ProgressView("加载卡片…")
        } else if viewModel.sessionComplete {
            LearnEmptyStateView(
                reviewedToday: viewModel.reviewedToday,
                dailyDueLimit: viewModel.dailyDueLimit
            )
        } else if let card = viewModel.currentCard {
            ScrollView {
                VStack(spacing: 24) {
                    WordCardView(
                        englishWord: card.knowledge.englishWord,
                        chineseTranslation: card.knowledge.chineseTranslation,
                        answerRevealed: viewModel.answerRevealed
                    )

                    if viewModel.pendingQuality != nil {
                        HStack(spacing: 16) {
                            Button {
                                SpeechService.shared.speak(card.knowledge.englishWord, accent: accent)
                            } label: {
                                Label("朗读", systemImage: "speaker.wave.2.fill")
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                            }
                            .buttonStyle(.bordered)

                            Button {
                                viewModel.submitNext()
                            } label: {
                                Text("下一张")
                                    .font(.headline)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 16)
                            }
                            .buttonStyle(.borderedProminent)
                        }

                        Button("记错了") {
                            viewModel.submitMisremembered()
                        }
                        .foregroundStyle(.orange)
                    } else {
                        RatingButtonsView { quality in
                            viewModel.chooseQuality(quality)
                        }
                    }
                }
                .padding()
            }
            .background(Color(.systemGroupedBackground))
        } else {
            LearnEmptyStateView(
                reviewedToday: viewModel.reviewedToday,
                dailyDueLimit: viewModel.dailyDueLimit
            )
        }
    }

    private func loadAccent() {
        let descriptor = FetchDescriptor<AppSettings>()
        if let settings = try? modelContext.fetch(descriptor).first {
            accent = settings.accent
        }
    }
}
