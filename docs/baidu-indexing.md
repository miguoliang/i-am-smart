# 百度索引提交指南

本文档说明如何将网站提交给百度搜索引擎进行索引。

## 前置条件

1. 已部署网站到生产环境（https://iamsmart.top）
2. 已配置环境变量 `NEXT_PUBLIC_BAIDU_SITE_VERIFICATION=codeva-baC55IEa6N`
3. 已确认网站可以正常访问

## 步骤一：注册并登录百度站长平台

1. 访问 [百度站长平台](https://ziyuan.baidu.com/)
2. 使用百度账号登录（如果没有账号，需要先注册）
3. 登录后进入"用户中心"

## 步骤二：添加网站并验证

1. 在百度站长平台首页，点击"添加网站"
2. 输入网站地址：`https://iamsmart.top`
3. 选择验证方式：**HTML标签验证**
4. 复制验证代码：`codeva-baC55IEa6N`
5. 点击"完成验证"

### 验证代码已配置

验证代码已通过环境变量 `NEXT_PUBLIC_BAIDU_SITE_VERIFICATION` 配置，并自动添加到网站首页的 `<head>` 标签中：

```html
<meta name="baidu-site-verification" content="codeva-baC55IEa6N" />
```

验证成功后，网站会显示"已验证"状态。

## 步骤三：提交 Sitemap

1. 在百度站长平台，进入"数据引入" → "链接提交"
2. 选择"Sitemap"提交方式
3. 输入 Sitemap 地址：`https://iamsmart.top/sitemap.xml`
4. 点击"提交"

### Sitemap 配置说明

- Sitemap 文件自动生成于：`/sitemap.xml`
- 当前包含的页面：
  - `/` - 首页（优先级：1.0，更新频率：daily）
  - `/terms` - 服务条款（优先级：0.3，更新频率：yearly）
  - `/privacy` - 隐私政策（优先级：0.3，更新频率：yearly）

Sitemap 已在 `robots.txt` 中声明，百度爬虫会自动发现。

## 步骤四：主动推送（可选，推荐）

主动推送可以让新页面更快被百度收录。可以通过以下方式实现：

### 方式一：API 主动推送

在页面发布或更新时，调用百度推送 API：

```bash
curl -X POST "http://data.zz.baidu.com/urls?site=https://iamsmart.top&token=YOUR_TOKEN" \
  -H "Content-Type: text/plain" \
  -d "https://iamsmart.top
https://iamsmart.top/terms
https://iamsmart.top/privacy"
```

**获取 Token：**
1. 在百度站长平台，进入"数据引入" → "链接提交"
2. 查看"接口调用地址"，其中包含 token 参数

### 方式二：手动提交

在百度站长平台，进入"数据引入" → "链接提交" → "手动提交"，输入需要提交的 URL。

## 步骤五：检查索引状态

1. 在百度站长平台，进入"数据引入" → "索引量"
2. 查看网站的索引情况
3. 通常需要等待几天到几周时间，百度才会开始抓取和索引

### 使用百度搜索验证

在百度搜索框中输入：`site:iamsmart.top`，查看已被索引的页面。

## 注意事项

1. **验证代码配置**：确保生产环境已设置环境变量 `NEXT_PUBLIC_BAIDU_SITE_VERIFICATION`
2. **Sitemap 可访问性**：部署后访问 `https://iamsmart.top/sitemap.xml` 确认可以正常访问
3. **Robots.txt**：确认 `https://iamsmart.top/robots.txt` 允许百度爬虫访问
4. **网站质量**：确保网站内容质量高，符合百度搜索质量指南
5. **更新频率**：定期更新网站内容，有助于提高索引速度

## 常见问题

### Q: 验证失败怎么办？
A: 
- 检查环境变量是否正确配置
- 确认网站已部署并可以访问
- 检查 HTML 源码中是否包含验证 meta 标签
- 清除浏览器缓存后重试

### Q: Sitemap 提交后多久会被抓取？
A: 通常需要几天到几周时间。可以通过"链接提交" → "提交历史"查看提交状态。

### Q: 如何加快索引速度？
A: 
- 使用主动推送 API 实时推送新页面
- 保持网站内容更新
- 确保网站加载速度快
- 优化网站结构和内容质量

## 相关链接

- [百度站长平台](https://ziyuan.baidu.com/)
- [百度搜索资源平台帮助中心](https://ziyuan.baidu.com/college/index)
- [Sitemap 协议说明](https://ziyuan.baidu.com/college/articleinfo?id=156)
