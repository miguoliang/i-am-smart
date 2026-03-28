---
name: cefr-vocab-json-translation
description: >-
  Edits CEFR vocabulary JSON arrays (englishWord, pos, level, chineseTranslation,
  exampleSentence, selfExaminePrompt, theme, imageName). Aligns translations and
  sense scope with each row's level (e.g. A1 vs B2). Use when translating or
  fixing entries in apps/pwa/data/cefr-*.json or the same schema elsewhere.
  Level field is only A1, A2, B1, B2, C1, or C2.
---

# CEFR 词汇 JSON 翻译

## 何时启用

用户要翻译、校对、补全或批量修正 `cefr-c1.json`、`cefr-c2.json` 等**同结构**文件时，按本 skill 执行。

## 数据形状（不得改结构）

根节点为**对象数组**。每个元素必须包含且仅使用这些键（顺序可保持与文件一致）。其中 `level` 仅允许 **CEFR**：`A1`、`A2`、`B1`、`B2`、`C1`、`C2`。

| 字段 | 类型 | 翻译/编辑规则 |
|------|------|----------------|
| `englishWord` | string | **不译**；保持原样。 |
| `pos` | string | **不译**；保留英文缩写（如 `v.`、`n.`、`adj.`、`n., v.`）。须与**本条 `level` 下要掌握的用法**一致：低级别条目只列该级别教的词性/义项，不要把更高级别才学的词性堆进同一条。 |
| `level` | string | **不译**；取值**只能是 CEFR 六级之一**：`A1`、`A2`、`B1`、`B2`、`C1`、`C2`（无其它值）。须与文件名一致（如 `cefr-a1.json` → `A1`，`cefr-b2.json` → `B2`）。翻译时以**本条目的 `level` 为准**，不是以你脑中的「该词全部义项」为准。 |
| `chineseTranslation` | string | **主要翻译目标**：只写**当前 `level` 要求掌握**的义项；简明中文，多义用 `；` 分隔并与 `pos` 对齐。同一词在 A1 与 B2 若各有一条，A1 条只给 A1 深度与范围，**禁止**把 B2 才需要的细译、僻义写进 A1 条。 |
| `exampleSentence` | string | 非空时：例句难度、词汇与**本条 `level` 匹配**；可译或撰写中文例句；空字符串保持 `""`。 |
| `selfExaminePrompt` | string | 非空时：自测提示的难度与**本条 `level` 匹配**；译为自然中文；空则保持 `""`。 |
| `theme` | string | 非空时按项目约定处理（常为分类标签）；空则 `""`。 |
| `imageName` | null \| string | 保持 `null` 或既有字符串，**勿**因翻译改为非法值。 |

输出必须是**合法 JSON**：双引号、无尾逗号、`null` 小写。

## 按 level 对齐（必修）

- **单条原则**：每一行是「**在该 CEFR 级别要学的这一笔**」。`level` 为 `A1` 时，只处理 A1 该掌握的词性、义项与表述；不要参考或合并更高级别（如 B2、C1）才学的义或术语深度。
- **同词多文件**：同一 `englishWord` 若出现在 `cefr-a1.json` 与 `cefr-b2.json`（示例），两条记录**各自独立**：低级文件中的译文保持简单、窄义；高级文件再扩展义项或语体，**不要**在低级条目中提前写高级内容。
- **与 `pos` 一致**：`chineseTranslation` 覆盖的义项数量应与 `pos` 及教学范围一致；若该级别只教一个常用义，不必为「完整性」补进高阶义项。

## 中文译文质量

- **义项**：在**满足本条 `level` 的前提下**，优先常用、贴切；避免英文单词未译（如把 `accelerate` 留在 `chineseTranslation`）。
- **错别字**：修正明显笔误（如「荒缪」→「荒谬」）。
- **多词性**：`pos` 为 `n., v.` 等时，译文用分号区分名词义与动词义（且仅包含该级别需要教的那些词性）。
- **繁简**：除非用户要求，默认**简体中文**。

## 大文件工作方式

- 单文件上万行：按用户指定的**词条范围**或**行号区间**分批修改，避免一次替换整文件。
- 每批修改后运行校验（见下），再提交下一批。

## 校验

修改后必须能 `JSON.parse`。示例：

```bash
node -e "JSON.parse(require('fs').readFileSync('apps/pwa/data/cefr-c1.json','utf8')); console.log('OK')"
```

若仓库另有脚本校验该数据，优先使用项目脚本。

## 与用户确认

- 目标仅为 `chineseTranslation` 还是包含 `exampleSentence` / `selfExaminePrompt`。
- 是否只补缺、只纠错，还是全文重译。
- 若用户提供词典或其它级别作参考：译文仍以**当前文件/当前条目的 `level`** 为边界，不把高级义项并入低级条目。

若用户要求译入**非中文**语言：字段名仍为 `chineseTranslation` 时需与用户确认是只改内容还是同时重构字段名与消费端代码（默认不重构）。
