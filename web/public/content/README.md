# 词包格式（内容与框架解耦）

陪练本的**框架**（词汇热身 → 开口练习问题库 → 口头巩固）固定不变。  
**内容**是可替换的词包文件：`peilian-pack/v1`。

不同机构 / 老师 / 教材，只要导出或手写符合本格式的 JSON，即可导入练习。

名词可以配图。动词、形容词常常没有合适的图——**图片可选**；不配图时练习页显示文字卡，问句换成动作 / 描述句型。

## 最小示例

```json
{
  "schema": "peilian-pack/v1",
  "id": "my-lesson-2026-03-15",
  "titleZh": "本周外教课",
  "titleEn": "This week's lesson",
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
      "chinese": "跑",
      "pos": "verb"
    },
    {
      "id": "happy",
      "english": "happy",
      "chinese": "快乐的",
      "pos": "adjective"
    }
  ]
}
```

## 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `schema` | 是 | 固定为 `peilian-pack/v1` |
| `id` | 是 | 词包唯一 id（导入同 id 会覆盖） |
| `titleZh` | 是 | 中文标题 |
| `titleEn` | 否 | 英文标题 |
| `blurb` | 否 | 一句话说明 |
| `words` | 是 | 1–40 个词条 |
| `words[].english` | 是 | 英文 |
| `words[].chinese` | 是 | 中文 |
| `words[].id` | 否 | 默认由英文生成 |
| `words[].pos` | 否 | `noun` / `verb` / `adjective`，默认 `noun` |
| `words[].article` | 否 | `a` / `an`，名词句型用；默认按首字母猜测 |
| `words[].image` | 否 | 见下；动词、形容词可省略 |

### `image` 三种写法

1. **内嵌**（推荐分享）：`data:image/jpeg;base64,…`（应用内「新建词包」上传图片会自动压缩并写入）
2. **网址**：`https://…` 公开图片链接
3. **站点相对路径**：如 `cards/apple.png`（仅本仓库内置名词图可用）

没有 `image` 时，词汇 / 开口 / 巩固阶段都用文字卡。

仓库内示例文件：`web/public/content/sample-week-food.peilian.json`、`sample-week-mixed.peilian.json`。

## 在网页里

- **导入词包**：首页 → 导入 JSON  
- **新建词包**：首页 → 新建（填词、选词性；图片可选，保存在本机浏览器）  
- **导出**：我的词包卡片上的「导出」  

自定义词包存在本机 IndexedDB，换浏览器或清站点数据会丢失，请用导出备份。
