# 课包格式（一课一份）

陪练本的**框架**（词汇热身 → 开口练习 → 课堂句子 → 口头巩固）固定不变。  
**内容**是可替换的课包文件：`peilian-pack/v1`。

场景：孩子上外教课，家长在旁边听，把这节课用到的**词**和**句子**记下来。一课一份，课后拿出来练。

上课时先记英文，中文 / 图片课后可补。JSON 只是备份 / 分享格式，不必手改。

## 最小示例

```json
{
  "schema": "peilian-pack/v1",
  "id": "class-2026-03-15",
  "titleZh": "3月15日外教课",
  "titleEn": "15 Mar class",
  "blurb": "机构讲义第 3 单元",
  "words": [
    {
      "id": "apple",
      "english": "apple",
      "chinese": "苹果",
      "pos": "noun",
      "article": "an",
      "image": "data:image/jpeg;base64,..."
    },
    {
      "id": "run",
      "english": "run",
      "pos": "verb"
    }
  ],
  "sentences": [
    {
      "id": "i-like-apples",
      "english": "I like apples.",
      "chinese": "我喜欢苹果。"
    },
    {
      "id": "can-i-have-water",
      "english": "Can I have some water, please?"
    }
  ]
}
```

可以只有词、只有句子，或两者都有；至少要有其中一项。

## 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `schema` | 是 | 固定为 `peilian-pack/v1` |
| `id` | 是 | 课包唯一 id（导入同 id 会覆盖） |
| `titleZh` | 是 | 中文标题 |
| `titleEn` | 否 | 英文标题 |
| `blurb` | 否 | 一句话说明 |
| `words` | 否 | 0–40 个词条 |
| `words[].english` | 是 | 英文 |
| `words[].chinese` | 否 | 中文，课后可补 |
| `words[].id` | 否 | 默认由英文生成 |
| `words[].pos` | 否 | `noun` / `verb` / `adjective`，默认 `noun` |
| `words[].article` | 否 | `a` / `an`，名词句型用；默认按首字母猜测 |
| `words[].image` | 否 | 见下；动词、形容词可省略 |
| `sentences` | 否 | 0–40 个课堂句子 |
| `sentences[].english` | 是 | 英文句子 |
| `sentences[].chinese` | 否 | 中文，课后可补 |
| `sentences[].id` | 否 | 默认由英文生成 |

### `image` 三种写法

1. **内嵌**（推荐分享）：`data:image/jpeg;base64,…`（应用内上传图片会自动压缩并写入）
2. **网址**：`https://…` 公开图片链接
3. **站点相对路径**：如 `cards/apple.png`（仅本仓库内置名词图可用）

没有 `image` 时，词汇 / 开口 / 巩固阶段都用文字卡。

仓库内示例文件：`web/public/content/sample-class.peilian.json`。

## 在网页里

日常改内容请用应用内编辑器，不要手改 JSON。

- **记一节课**：首页 → 记一节课（先记英文，中文课后可补）
- **分科巩固**：点某一节课 → 只练词汇 / 名词 / 动词 / 形容词 / 句子
- **综合巩固**：点某一节课混着抽问，或首页把几节课混在一起练
- **编辑**：我的课 → 编辑
- **复制示例**：示例课 → 复制并编辑
- **导入备份**：首页 → 导入备份（别人导出的 `.peilian.json`）
- **导出备份**：我的课 → 导出备份

自定义课包存在本机 IndexedDB，换浏览器或清站点数据会丢失，请用导出备份或云端同步。
