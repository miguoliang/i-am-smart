---
name: cefr-vocab-example-theme-prompt
description: >-
  Author or revise exampleSentence, selfExaminePrompt, and theme in CEFR
  vocabulary JSON using judgment (model or human). Keeps example-sentence
  vocabulary at or below each entry's level (A1–C2). selfExaminePrompt must not
  contain the entry's englishWord. Do not use heuristic batch scripts for theme
  or prompt quality. Use for cefr-*.json or the same schema.
---

# CEFR 词汇：例句、自测提示与主题

## 何时启用

- 用户要**撰写、补全或改写** `apps/pwa/data/cefr-*.json` 中的 **`exampleSentence`**、**`selfExaminePrompt`**、**`theme`**。
- 用户强调：**例句里除目标词外，其余用词不得超过该条 `level` 对应的难度**（例如 B1 条目的例句整体应落在 B1 及以下）。

与 `chineseTranslation` / `pos` 的翻译规则一并处理时，仍以 `cefr-vocab-json-translation` 为准；本 skill 只管**例句、自测、主题**三条字段的写作规范。

## 工作方式（必修）

- **`theme` 与 `selfExaminePrompt`**：须按**义项、词性、学习场景**做判断，由**模型或人工**撰写与润色。**不要用**基于规则的批量脚本推断主题或套用模板句当自测（历史上曾试过脚本填空，主题与提示质量不可靠，已废弃）。
- **`exampleSentence`**：同样按级别与义项手写；仅在确有把握时可用工具辅助，但仍需人审或模型按本 skill 逐条把关。
- **批量**：大文件按用户指定的**词条范围或行号区间**分批处理；每批后 `JSON.parse` 校验。

## 数据形状（不得改结构）

每条目仍只使用既有键；`level` 仅为 **A1、A2、B1、B2、C1、C2**，且须与文件名一致（`cefr-b1.json` → `B1`）。

| 字段 | 本 skill 要点 |
|------|----------------|
| `exampleSentence` | **英文**例句（与仓库现有 `cefr-*.json` 一致）。除**目标词**外，句中其它词应控制在**不高于本条 `level`** 的常见范围。 |
| `selfExaminePrompt` | **英文**自测问句。句式与词汇 ≤ 本条 **level**；**不得出现**本条 `englishWord`（含大小写与作为子串出现）；多词短语条目亦不得整体或拆开嵌入提示，以免泄题。 |
| `theme` | **英文**主题标签，与项目已有词表统一（见下）。空字符串 `""` 时应补全。 |

## `exampleSentence`（级别上限）

- **核心规则**：例句用于展示本条 `englishWord` 在 `chineseTranslation` 对应义项下的典型用法；**句中其它单词、短语、结构**应优先选用该 **level 及以下** 常见词与结构。
- **不要做**：为显得「高级」在例句里塞进明显属于更高 band 的词汇、书面语、低频隐喻或专业术语（除非该术语就是目标词）。
- **若目标词本身偏难**：仍用尽量简单的上下文把它说清楚；避免再叠高难度修饰语。
- **长度与语法**：陈述或常见疑问即可；B1 可用复合句，但从句与连接词仍应属 B1 常见范围。
- **多词性 / 多义**：若 `pos` 含多种词性，例句优先覆盖**本条译文对应**的那一义；必要时句式略复杂但仍守级别上限。

## `selfExaminePrompt`

- **禁词（必修）**：提示中**不得出现**当前条的 **`englishWord`**。不要用引号点名该词，也不要让该词以任何词形（如时态、派生）出现在问句里，避免**泄题**。若 `englishWord` 为短语（如 `according to`），整段短语及其片段均勿写入提示；改用场景、功能或释义角度的描述来发问。
- **形式**：以 **What / How / When / Why / Do you…** 等开头的开放式问题为主，引导学习者**联系自身经验**或**从语境想起用法**。
- **级别**：问句里的词与语法难度 ≤ 本条 `level`；避免用学习者在该 level 尚未覆盖的抽象堆砌。
- **内容**：与义项相关但不点名词形；不要问成需要别的 level 才能回答的修辞。
- **与例句分工**：例句展示「别人怎么说」；自测问「你会怎么想 / 怎么做」，避免与例句逐字重复。

## `theme`

从下列**与现有 `cefr-a1.json` / `cefr-a2.json` 风格一致**的标签中选**一个**（英文，首字母大写式标题）：

`Grammar`、`Actions`、`Daily Life`、`Work`、`Education`、`Emotions`、`Time`、`Places`、`Weather`、`Nature`、`Food & Drink`、`Transportation`、`Body`、`Family`、`Home`、`Technology`、`Clothing`、`Sports`、`Communication`、`Travel`、`Health`、`Shopping`、`Numbers`、`Culture`、`Politics`、`Science`、`Business`、`Law`、`Media`、`Military`、`Music`、`Art`、`Religion`、`Animals`、`Plants`、`Position`

- 按义项选**最贴切**的一类；不确定时选更宽的上位类（如 `Daily Life`）。
- 全文件内**拼写与大小写**与上表及已有文件保持一致。

## 与其它 skill 的关系

- **级别边界**：`cefr-word-meaning-by-level` 描述「各 band 新增什么」；写例句时只服务**当前条目的 level**，不把高阶义写进例句。

## 校验

```bash
node -e "JSON.parse(require('fs').readFileSync('apps/pwa/data/cefr-b1.json','utf8')); console.log('OK')"
```

## 避免

- **`selfExaminePrompt` 里写出本条 `englishWord`**（含变形或短语内嵌）。
- 例句或自测里出现**明显高于**本条 `level` 的词汇（除非该词即 `englishWord`）。
- 为凑主题选与义项无关的 `theme`。
- 用**纯规则脚本**批量生成 `theme` / `selfExaminePrompt` 并当作终稿。
- 修改 `englishWord`、`pos`、`level`、`chineseTranslation`、`imageName`——除非用户明确要求一并编辑。
