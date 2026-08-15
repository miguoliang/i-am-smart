# 课包格式（先课包，再排期）

陪练本的**框架**（词汇热身 → 开口练习 → 问答 → 口头巩固）固定不变。  
**内容**是可替换的课包文件：`peilian-pack/v1`。

场景：课程先有计划。先建**课包**（例如每周二、周四），再按规则排出空课。上课时把这节课的**词汇**和**问答**记下来。一课一份，课后拿出来练。

上课时先记英文，中文 / 答句 / 图片课后可补。JSON 只是备份 / 分享格式，不必手改。

## 最小示例

```json
{
  "schema": "peilian-pack/v1",
  "id": "class-2026-03-17",
  "titleZh": "3月17日 · 周二",
  "titleEn": "17 Mar",
  "blurb": "外教口语",
  "courseId": "course-oral-1",
  "scheduledOn": "2026-03-17",
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
      "id": "hello-how-are-you",
      "english": "Hello, how are you?",
      "chinese": "你好吗？",
      "answer": "I'm fine, thank you.",
      "answerZh": "我很好，谢谢。"
    },
    {
      "id": "i-like-apples",
      "english": "I like apples.",
      "chinese": "我喜欢苹果。"
    }
  ]
}
```

可以只有词、只有问答、两者都有，或先排出空课再上课补内容。

## 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `schema` | 是 | 固定为 `peilian-pack/v1` |
| `id` | 是 | 这一节课的唯一 id（导入同 id 会覆盖） |
| `titleZh` | 是 | 中文标题 |
| `titleEn` | 否 | 英文标题 |
| `blurb` | 否 | 一句话说明，常写课包名 |
| `courseId` | 否 | 所属课包 id |
| `scheduledOn` | 否 | 排期日期 `YYYY-MM-DD` |
| `words` | 否 | 0–40 个词条（词汇） |
| `words[].english` | 是 | 英文 |
| `words[].chinese` | 否 | 中文，课后可补 |
| `words[].id` | 否 | 默认由英文生成 |
| `words[].pos` | 否 | `noun` / `verb` / `adjective`，默认 `noun` |
| `words[].article` | 否 | `a` / `an`，名词句型用；默认按首字母猜测 |
| `words[].image` | 否 | 见下；动词、形容词可省略 |
| `sentences` | 否 | 0–40 组问答 |
| `sentences[].english` | 是 | 问句（或老师带读的一句） |
| `sentences[].chinese` | 否 | 问句中文，课后可补 |
| `sentences[].answer` | 否 | 答句英文 |
| `sentences[].answerZh` | 否 | 答句中文 |
| `sentences[].id` | 否 | 默认由英文生成 |

课包本身（名称、每周几上课）存在本机，不写在这一节课的 JSON 里。导出某一节课时会带上 `courseId` / `scheduledOn`。

### `image` 三种写法

1. **内嵌**（推荐分享）：`data:image/jpeg;base64,…`（应用内上传图片会自动压缩并写入）
2. **网址**：`https://…` 公开图片链接
3. **站点相对路径**：如 `cards/apple.png`（仅本仓库内置名词图可用）

没有 `image` 时，词汇 / 开口 / 巩固阶段都用文字卡。

仓库内示例文件：`web/public/content/sample-class.peilian.json`。

## 在网页里

日常改内容请用应用内编辑器，不要手改 JSON。

- **建课包**：首页 → 建课包 → 起名、选每周几 → 排出空课
- **记一节课**：没有课包时，也可以先建一节今天的空课
- **上课记**：点某一节课 → 上课记。词汇回车记下；有空格的当成问答，答句可补
- **分科巩固**：点某一节课 → 只练词汇 / 名词 / 动词 / 形容词 / 问答
- **综合巩固**：点某一节课混着抽问，或首页把几节课混在一起练
- **编辑**：排期课 → 编辑
- **复制示例**：示例课 → 复制并编辑
- **导入备份**：首页 → 导入备份（别人导出的 `.peilian.json`）
- **导出备份**：排期课 → 导出备份

自定义课包和排期存在本机 IndexedDB，换浏览器或清站点数据会丢失，请用导出备份或云端同步。
