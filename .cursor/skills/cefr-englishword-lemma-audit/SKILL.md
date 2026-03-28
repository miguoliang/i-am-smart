---
name: cefr-englishword-lemma-audit
description: >-
  Finds CEFR JSON entries whose englishWord is not a clean dictionary lemma
  (numeric homonym tags like do1, parenthetical glosses). Use when auditing or
  normalizing apps/pwa/data/cefr-*.json.
---

# CEFR `englishWord` 非词目审计

## 何时启用

- 用户要**找出** `englishWord` 不是「干净英文词/词组」的条目（如同形异义编号 `do1`、括号内释义 `bank (money)`）。
- 用户要在其他 `cefr-*.json` 上做**同样规则的批量检查**。

与「翻译/改中文」相关时，可配合 `.cursor/skills/cefr-vocab-json-translation/SKILL.md`；本 skill 只管**词头形态**与**检索方法**。

## 两类常见非词目形态

| 类型 | 说明 | 示例 |
|------|------|------|
| **数字后缀** | 用 `1`、`2` 等同形异义区分符，非标准词典词形 | `do1`, `can1`, `live1` |
| **括号释义** | 词干 + 括号内说明义项或领域 | `bank (money)`, `like (similar)` |

二者可并存，如 `last1 (final)`、`second1 (next after the first)`。

## 在仓库内快速检索

在目标 JSON 文件上执行（路径按需替换）：

```bash
# 含数字（含括号内数字）
rg '"englishWord": "[^"]*[0-9]' apps/pwa/data/cefr-*.json

# 含括号
rg '"englishWord": "[^"]*[\(\)]' apps/pwa/data/cefr-*.json
```

用 Node 一次性列出所有「含数字或括号」的 `englishWord`（可改为遍历 `cefr-*.json`）：

```bash
node -e "
const fs=require('fs');
const path=require('path');
for (const name of ['cefr-a1.json','cefr-a2.json','cefr-b1.json','cefr-b2.json','cefr-c1.json','cefr-c2.json']) {
  const p=path.join('apps/pwa/data',name);
  const data=JSON.parse(fs.readFileSync(p,'utf8'));
  const bad=data.filter(o=>{
    const w=o.englishWord||'';
    return /[0-9]/.test(w)||/[()]/.test(w);
  });
  console.log(name+':',bad.length);
  bad.forEach(o=>console.log(' ',o.englishWord));
}
"
```

## 历史对照（已规范）

- **`cefr-a1.json`** 曾含 **15 条**非词目（如 `do1`、`bank (money)`；`like` 两条义项），已改为词典词形。
- **`cefr-a2.json`** 曾含 **10 条**（如 `can2`、`bear (animal)`、`ring1`/`ring2`），已改为词典词形；同形异义靠 `pos` / 译文 / 例句区分。

`cefr-b1.json`–`cefr-c2.json` 扫描时无此类形态。对仓库内 `cefr-*.json` 跑上一节脚本：各文件 `count` 为 **0** 表示无数字/括号词头；若大于 0，以脚本输出为准。

## 规范化时（可选，需与产品约定）

- **仅审计**：不改字段，用于统计或后续人工处理。
- **若要改成纯词目**：需与消费端（搜索、去重、SRS）对齐；常见做法是保留唯一 `englishWord`（如 `do`）并把区分信息放进 `pos` / 义项字段 / 单独 `senseId`，**不要**在未改应用逻辑时单独改 JSON。

## 与翻译 skill 的关系

词条编辑时 `englishWord` 使用**规范词形**；义项与级别写在 `pos`、`chineseTranslation` 等字段（见 `cefr-vocab-json-translation`）。
