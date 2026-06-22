import SwiftData
import SwiftUI

struct SettingsView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var viewModel: SettingsViewModel?

    var body: some View {
        NavigationStack {
            Group {
                if let viewModel {
                    Form {
                        Section("考试目标") {
                            ForEach(ExamScope.pickerEntries) { entry in
                                Button {
                                    viewModel.updateExamTarget(entry)
                                } label: {
                                    HStack {
                                        Text(entry.label)
                                            .foregroundStyle(.primary)
                                        Spacer()
                                        if ExamScope.scope(forExamTargetId: viewModel.examTargetId) == entry.scope {
                                            Image(systemName: "checkmark")
                                                .foregroundStyle(.blue)
                                        }
                                    }
                                }
                            }
                        }

                        Section("每日复习上限") {
                            ForEach(SM2Constants.dailyDueLimitPresets, id: \.self) { limit in
                                Button {
                                    viewModel.updateDailyDueLimit(limit)
                                } label: {
                                    HStack {
                                        Text("\(limit) 张")
                                            .foregroundStyle(.primary)
                                        Spacer()
                                        if viewModel.dailyDueLimit == limit {
                                            Image(systemName: "checkmark")
                                                .foregroundStyle(.blue)
                                        }
                                    }
                                }
                            }
                        }

                        Section("发音口音") {
                            ForEach(SpeechAccent.allCases) { accent in
                                Button {
                                    viewModel.updateAccent(accent)
                                } label: {
                                    HStack {
                                        Text(accent.label)
                                            .foregroundStyle(.primary)
                                        Spacer()
                                        if viewModel.accent == accent {
                                            Image(systemName: "checkmark")
                                                .foregroundStyle(.blue)
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    ProgressView()
                }
            }
            .navigationTitle("设置")
        }
        .onAppear {
            if viewModel == nil {
                viewModel = SettingsViewModel(modelContext: modelContext)
            }
            viewModel?.load()
        }
    }
}
