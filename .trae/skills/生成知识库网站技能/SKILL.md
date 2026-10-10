---
name: "生成知识库网站技能"
description: "生成可部署到 GitHub Pages 的多页面静态知识库网站（含目录、搜索、流程图、图表、参考来源）。当用户要搭建个人知识库网站、文档站、学习笔记站、技术博客时调用。"
---

# 生成知识库网站技能

生成多页面静态知识库网站，支持目录导航、站内搜索、Mermaid 流程图、ECharts 图表、参考来源超链接，可一键部署到 GitHub Pages。纯 HTML/CSS/JS，无构建工具依赖，任何设备访问均可正常显示。

## 何时调用

当用户出现以下意图时调用本技能：
- "搭建一个知识库网站"
- "把我的笔记/文档做成网站"
- "做一个学习笔记的网页"
- "生成一个文档站"
- "做一个个人知识网站并部署到 GitHub Pages"
- "做一个多页面的技术博客"

## 工作流程

### 第一步：需求澄清

向用户确认以下要素（如用户未明确）：
1. **主题**：网站围绕什么知识领域
2. **页面数量**：建议 3-6 个页面（首页 + 内容页）
3. **内容来源**：用户提供资料 / 需联网搜集 / 从现有文件转换
4. **页面划分逻辑**：按知识模块 / 按难度递进 / 按业务流程
5. **配色偏好**：默认蓝色学术风，可定制

### 第二步：创建项目结构

```
project-root/
├── .nojekyll              # 【关键】禁用 Jekyll，解决 _ 开头目录在 GitHub Pages 不显示的问题
├── index.html             # 首页/总览
├── page-1.html            # 内容页1
├── page-2.html            # 内容页2
├── page-3.html            # 内容页3
├── assets/
│   ├── styles.css        # 统一样式（设计令牌 + 响应式 + 所有组件）
│   ├── app.js            # 侧边栏折叠 + 滚动监听 + 搜索功能
│   ├── charts.js         # ECharts + Mermaid 初始化与配置
│   └── search-index.js   # 站内搜索索引（JSON 数组）
```

### 第三步：生成 styles.css

核心设计令牌（CSS 变量），所有页面共用：

```css
:root {
  --bg: #ffffff;
  --bg-soft: #f6f6f7;
  --bg2: #ffffff;
  --ink: #3c3c43;
  --muted: #63666e;
  --rule: #e2e2e3;
  --accent: #0756ab;          /* 主色，可按主题定制 */
  --accent2: #0a6bd1;
  --accent-soft: rgba(7,86,171,0.08);
  --success: #059669;
  --warning: #d97706;
  --danger: #dc2626;
  --radius-sm: 6px;
  --radius: 10px;
  --radius-lg: 14px;
  --shadow-sm: 0 1px 3px rgba(15,23,42,0.06);
  --shadow: 0 4px 12px rgba(15,23,42,0.07);
  --shadow-lg: 0 12px 32px rgba(15,23,42,0.10);
  --transition: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  --font-mono: 'JetBrainsMono', 'SFMono-Regular', monospace;
}
```

**必须实现的组件类**：
- `.topnav` / `.topnav-inner` / `.topnav-links` / `.topnav-search`：顶部导航栏（品牌 + 页面链接 + 搜索框）
- `.docs-shell`：三栏布局容器（侧栏 + 主内容）
- `.docs-sidebar` / `.sb-accordion`：左侧折叠目录
- `.docs-main`：主内容区
- `.crumb`：面包屑导航
- `.page-title` / `.page-subtitle` / `.page-meta` / `.stats-strip`：页面头部信息
- `section[id]` / `h2` / `h3` / `h4`：章节层级（侧栏目录自动从 section h2/h3 生成）
- `.callout` / `.callout-mini`：提示框
- `.table-wrap`：表格容器（横向滚动）
- `pre.mermaid`：Mermaid 流程图容器
- `.page-pager` / `.pager-prev` / `.pager-next`：上一篇/下一篇导航
- `.progress-bar` / `.back-to-top`：滚动进度条与返回顶部
- `footer` / `.sources`：页脚参考来源

**响应式断点**（必须实现）：
- `> 1280px`：三栏（侧栏 + 主内容 + 右侧目录可选）
- `1024px - 1280px`：两栏（侧栏 + 主内容）
- `768px - 1024px`：侧栏可折叠，主内容占满
- `< 768px`：单栏，顶部导航折叠为汉堡菜单，侧栏隐藏

### 第四步：生成 app.js

实现以下功能（全部原生 JS，无依赖）：

1. **左侧目录自动生成**：遍历 `main section[id]`，从 h2 生成一级目录，从 section 内 h3 生成二级目录，点击展开/折叠
2. **滚动监听**：进度条宽度 + 返回顶部按钮显隐 + 当前章节高亮
3. **搜索功能**：读取 `search-index.js` 的索引数据，实时过滤并展示匹配结果

**侧栏目录生成关键逻辑**：
```javascript
const sections = document.querySelectorAll('main section[id]');
sections.forEach(function(sec) {
  const h2 = sec.querySelector('h2');
  // 取直接属于此 section 的 h3（排除嵌套子 section 内的）
  const directH3s = Array.from(sec.querySelectorAll('h3')).filter(function(h3) {
    let p = h3.parentElement;
    while (p && p.tagName !== 'SECTION') p = p.parentElement;
    return p === sec;
  });
  // 生成折叠项 HTML...
});
```

**A11Y 可访问性要求**：
- 折叠项 header 添加 `role="button"` 和 `aria-expanded`
- 支持 Space 键触发点击（Enter 由链接默认行为处理）
- 焦点样式使用 `:focus-visible` 而非 `:focus`

### 第五步：生成 search-index.js

索引为 JSON 数组，每项结构：
```javascript
const SEARCH_INDEX = [
  {
    "p": "page-1.html",      // 页面文件名
    "a": "section-id",       // 锚点 ID
    "s": "所属大章节标题",    // section 标题
    "t": "索引文本",          // 被搜索的标题或表格内容
    "y": "标题"               // 类型：标题/表格/流程图
  }
  // ...
];
```

**索引覆盖范围**：所有 h2/h3/h4 标题、关键表格表头、流程图标题、提示框标题。

### 第六步：生成 charts.js

**CDN 引用（关键经验：必须用 CDN，不可用本地 JS）**：
```html
<!-- 在每个 HTML 页面底部引入 -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js" defer></script>
<script src="assets/charts.js?v=版本号" defer></script>
<script src="assets/app.js?v=版本号" defer></script>
```

**Mermaid 初始化配置**：
```javascript
if (window.mermaid) {
  mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    securityLevel: 'loose',
    themeVariables: {
      primaryColor: '#dbeafe',
      primaryTextColor: '#1e3a8a',
      primaryBorderColor: '#2563eb',
      lineColor: '#6b7a90',
      fontSize: '13px'
    }
  });
}
```

**ECharts 初始化**：读取 CSS 变量作为配色，按页面是否存在图表容器决定是否初始化。

### 第七步：生成 HTML 页面

每个页面遵循统一结构：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>页面标题 | 网站名称</title>
  <meta name="description" content="页面描述">
  <meta name="keywords" content="关键词">
  <meta property="og:title" content="页面标题">
  <meta property="og:description" content="页面描述">
  <meta property="og:type" content="website">
  <link rel="stylesheet" href="assets/styles.css?v=版本号">
</head>
<body>

<!-- 移动端侧栏遮罩 -->
<div class="sidebar-overlay" onclick="setSidebar(false)"></div>

<!-- 顶部导航 -->
<nav class="topnav">
  <div class="topnav-inner">
    <button class="topnav-toggle" aria-label="打开导航菜单">☰</button>
    <a class="brand" href="index.html">网站名称</a>
    <nav class="topnav-links" aria-label="专栏导航">
      <a href="index.html">页面1</a>
      <a href="page-1.html" class="active">页面2</a>
      <!-- ... -->
    </nav>
    <div class="topnav-search">
      <input type="text" id="globalSearch" placeholder="搜索关键词..." autocomplete="off">
      <div class="search-results" id="searchResults"></div>
    </div>
  </div>
</nav>

<!-- 三栏布局 -->
<div class="docs-shell">
  <aside class="docs-sidebar" id="docsSidebar">
    <nav class="sb-accordion" id="sbAccordion" aria-label="本页目录"></nav>
  </aside>

  <main class="docs-main">
    <div class="crumb"><a href="index.html">首页</a><span class="sep">/</span><span>当前页</span></div>
    <h1 class="page-title">页面标题</h1>
    <p class="page-subtitle">副标题</p>
    <div class="page-meta"><!-- 元数据项 --></div>
    <div class="stats-strip"><!-- 统计数字 --></div>

    <section id="section-1">
      <h2>章节标题</h2>
      <p>正文内容...</p>

      <!-- Mermaid 流程图 -->
      <figure class="diagram">
        <pre class="mermaid">
graph TD
    A[步骤A] --> B[步骤B]
        </pre>
        <figcaption>图N：图说明</figcaption>
      </figure>

      <!-- 表格 -->
      <div class="table-wrap">
        <table>
          <thead><tr><th>列1</th><th>列2</th></tr></thead>
          <tbody><tr><td>数据1</td><td>数据2</td></tr></tbody>
        </table>
      </div>

      <!-- 提示框 -->
      <div class="callout">
        <p><strong>提示：</strong>重要注意事项</p>
      </div>

      <h3>子章节标题</h3>
      <p>子章节内容...</p>
    </section>

    <!-- 上一篇/下一篇导航 -->
    <nav class="page-pager" aria-label="上一篇与下一篇导航">
      <a href="prev.html" class="pager-prev"><span class="pg-label">← 上一篇</span><span class="pg-title">上一篇标题</span></a>
      <a href="next.html" class="pager-next"><span class="pg-label">下一篇 →</span><span class="pg-title">下一篇标题</span></a>
    </nav>
  </main>
</div>

<!-- 滚动进度条与返回顶部 -->
<div class="progress-bar" id="progressBar"></div>
<button class="back-to-top" id="backToTop" onclick="window.scrollTo({top:0,behavior:'smooth'})">↑</button>

<!-- 页脚：参考来源 -->
<footer>
  <div class="container">
    <div class="sources">
      <h2>参考来源</h2>
      <ol>
        <li id="cite-1">
          <span class="src-title">来源名称, 内容描述。</span>
          <a href="URL" target="_blank" rel="noopener">URL</a>
        </li>
        <!-- 正文用 <sup><a href="#cite-1">[1]</a></sup> 引用 -->
      </ol>
    </div>
  </div>
</footer>

<!-- 脚本引入（CDN + 本地） -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js" defer></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js" defer></script>
<script src="assets/charts.js?v=版本号" defer></script>
<script src="assets/app.js?v=版本号" defer></script>
</body>
</html>
```

### 第八步：内容组织原则

1. **首页（index.html）**：总览 + 学习路径 + 核心概念对比表 + 版本差异说明 + 快速入口
2. **内容页**：按知识模块划分，每页聚焦一个主题，包含知识体系 + 操作流程 + 常见问题 + 实战案例
3. **章节层级**：section > h2（大章节）> h3（小节）> h4（子小节），不超过 4 级
4. **图表配图**：每个核心流程配 Mermaid 流程图，每个数据对比配 ECharts 图表
5. **参考来源**：所有外部资料必须在 footer 列出超链接，正文用 `<sup>` 标注引用编号

### 第九步：部署到 GitHub Pages

1. 在 GitHub 创建仓库
2. 推送所有文件到 `main` 分支
3. 仓库 Settings → Pages → Source 选 `main` 分支
4. 等待 1-2 分钟自动部署
5. 访问 `https://用户名.github.io/仓库名/`

**推送命令**：
```bash
git init
git add -A
git commit -m "feat: 初始化知识库网站"
git branch -M main
git remote add origin https://github.com/用户名/仓库名.git
git push -u origin main
```

## 关键经验总结

### 1. .nojekyll 文件（必须）
GitHub Pages 默认使用 Jekyll 处理，会忽略以 `_` 开头的目录（如 `_shared`）。在仓库根目录添加空文件 `.nojekyll` 可禁用 Jekyll，确保所有资源正常服务。

### 2. CDN 引用图表库（必须）
**不可使用本地 JS 文件引用 echarts/mermaid**，因为：
- GitHub Pages 环境下相对路径可能失效
- 本地文件增大仓库体积
- CDN 可保证任何设备访问都能加载
```html
<!-- 正确 -->
<script src="https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js" defer></script>
<!-- 错误（会导致 GitHub Pages 上图表不显示） -->
<script src="./assets/js/echarts.min.js" defer></script>
```

### 3. 版本号缓存控制
每次修改 CSS/JS 后，升级引用路径的版本号参数，强制浏览器重新加载：
```html
<link rel="stylesheet" href="assets/styles.css?v=20260101a">
```
版本号格式建议：`v=YYYYMMDD[字母]`，如 `v=20260101a`、`v=20260101b`。

### 4. 搜索索引维护
每次新增/修改页面内容后，同步更新 `search-index.js`，确保搜索结果与页面内容一致。

### 5. 响应式设计
移动端必须测试：
- 顶部导航栏在手机上是否可见（需折叠为汉堡菜单）
- 表格是否可横向滚动（`.table-wrap` 容器）
- 流程图是否自适应宽度

### 6. A11Y 可访问性
- 折叠项：`role="button"` + `aria-expanded` + Space 键支持
- 焦点样式：使用 `:focus-visible`
- 图片：添加 `alt` 属性
- 表单：关联 `label`

### 7. 参考来源可信度
优先引用官方文档/权威来源，正文引用格式：
```html
正文内容<sup><a href="#cite-1">[1]</a></sup>
```
页脚对应：
```html
<li id="cite-1">
  <span class="src-title">来源名称, 内容描述。</span>
  <a href="URL" target="_blank" rel="noopener">URL</a>
</li>
```

## 配色方案定制

修改 `--accent` 变量即可切换主题色，常见配色：

| 主题 | --accent | --accent2 |
|------|----------|-----------|
| 蓝色学术风（默认） | #0756ab | #0a6bd1 |
| 绿色自然风 | #059669 | #10b981 |
| 紫色科技风 | #7c3aed | #8b5cf6 |
| 橙色活力风 | #ea580c | #f97316 |
| 红色警示风 | #dc2626 | #ef4444 |

## 验证清单

部署后检查：
- [ ] 所有页面顶部导航栏 4 个链接可见且可点击
- [ ] 移动端（手机）导航栏折叠为汉堡菜单
- [ ] 所有 Mermaid 流程图正常渲染
- [ ] 所有 ECharts 图表正常显示
- [ ] 左侧目录自动生成且可折叠
- [ ] 搜索框输入关键词有结果
- [ ] 滚动进度条和返回顶部按钮工作
- [ ] 参考来源超链接可跳转
- [ ] 上一篇/下一篇导航正确
