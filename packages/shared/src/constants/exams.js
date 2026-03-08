"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_EXAM_TARGET = exports.EXAM_TARGETS = void 0;
exports.getExamTarget = getExamTarget;
exports.getExamPrimaryLevel = getExamPrimaryLevel;
exports.getExamLevels = getExamLevels;
exports.EXAM_TARGETS = [
    { id: "ket", name: "KET", fullName: "剑桥KET", levels: ["A1", "A2"], isFree: true },
    { id: "pet", name: "PET", fullName: "剑桥PET", levels: ["B1", "B2"], isFree: false },
    { id: "cet4", name: "四级", fullName: "大学英语四级", levels: ["B1", "B2"], isFree: false },
    { id: "cet6", name: "六级", fullName: "大学英语六级", levels: ["B2", "C1"], isFree: false },
    { id: "ielts", name: "雅思", fullName: "雅思 IELTS", levels: ["B2", "C1", "C2"], isFree: false },
    { id: "toefl", name: "托福", fullName: "托福 TOEFL", levels: ["B2", "C1", "C2"], isFree: false },
];
exports.DEFAULT_EXAM_TARGET = "ket";
/** Get exam target by id */
function getExamTarget(id) {
    return exports.EXAM_TARGETS.find(e => e.id === id);
}
/** Get the primary (highest) CEFR level for an exam target */
function getExamPrimaryLevel(id) {
    const exam = getExamTarget(id);
    if (!exam)
        return "A1";
    return exam.levels[exam.levels.length - 1];
}
/** Get all CEFR levels for an exam target */
function getExamLevels(id) {
    var _a;
    const exam = getExamTarget(id);
    return (_a = exam === null || exam === void 0 ? void 0 : exam.levels) !== null && _a !== void 0 ? _a : ["A1"];
}
