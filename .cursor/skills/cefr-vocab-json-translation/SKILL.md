---
name: cefr-vocab-json-translation
description: >-
  Edits CEFR vocabulary JSON arrays (englishWord, pos, level, chineseTranslation,
  exampleSentence, selfExaminePrompt, theme, imageName). Use when translating or
  fixing entries in apps/pwa/data/cefr-*.json or the same schema elsewhere.
---

# CEFR 词汇 JSON 翻译

## 何时启用

用户要翻译、校对、补全或批量修正 `cefr-c1.json`、`cefr-c2.json` 等**同结构**文件时，按本 skill 执行。

## 数据形状（不得改结构）

根节点为**对象数组**。每个元素必须包含且仅使用这些键（顺序可保持与文件一致）：

| 字段 | 类型 | 翻译/编辑规则 |
|------|------|----------------|
| `englishWord` | string | **不译**；保持原样。 |
| `pos` | string | **不译**；保留英文缩写（如 `v.`、`n.`、`adj.`、`n., v.`）。 |
| `level` | string | **不译**；须与文件名一致（`cefr-c1.json` → `C1`，`cefr-c2.json` → `C2`）。 |
| `chineseTranslation` | string | **主要翻译目标**：简明中文义项；多义用中文分号 `；` 分隔，与 `pos` 多词性对应时优先对齐。 |
| `exampleSentence` | string | 非空时：可译或撰写中文例句；空字符串保持 `""`。 |
| `selfExaminePrompt` | string | 非空时：译为自然中文自测提示；空则保持 `""`。 |
| `theme` | string | 非空时按项目约定处理（常为分类标签）；空则 `""`。 |
| `imageName` | null \| string | 保持 `null` 或既有字符串，**勿**因翻译改为非法值。 |

输出必须是**合法 JSON**：双引号、无尾逗号、`null` 小写。

## 中文译文质量

- **义项**：优先常用、考试/学术语境贴切；避免英文单词未译（如把 `accelerate` 留在 `chineseTranslation`）。
- **错别字**：修正明显笔误（如「荒缪」→「荒谬」）。
- **多词性**：`pos` 为 `n., v.` 等时，译文用分号区分名词义与动词义。
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

若用户要求译入**非中文**语言：字段名仍为 `chineseTranslation` 时需与用户确认是只改内容还是同时重构字段名与消费端代码（默认不重构）。
