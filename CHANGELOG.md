# vuepress-theme-uniapp-official

## 1.6.41

### Patch Changes

- feat: 即使没有导读如果有 ads 也显示
  feat(search): 同一内容不再重复发送请求
  feat: 支持 AI 流式回答
  fix: 问 AI 在输入内容时会比无内容时高一点

## 1.6.40

### Patch Changes

- refactor: 布局重构，将 Sidebar、Toc 和 Page 在大屏中整体居中显示
  refactor: 重构移动端导航展示，现在 sidebar 会作为子项在二级导航下展开，层级更清晰
  fix(sidebar): 优化 Sidebar 激活项定位与桌面端样式
  - 将激活链接滚动逻辑收敛到 Sidebar
  - 修复 hash 链接定位和分组展开时序
  - 优化非移动端层级、交互状态和滚动条样式
    feat(sidebar): PC 上 sidebar 支持收起
    fix(toc-top): 顶部 TOC 在路由到其他页面时重置展开状态
    feat: 优化移动端 sidebar 选中样式

## 1.6.39

### Patch Changes

- feat: 优化 Navbar 一级导航滚动时性能

## 1.6.38

### Patch Changes

- feat: Help 兼容以 $site.base 开头的 href

## 1.6.37

### Patch Changes

- feat: 添加 Help 组件

## 1.6.36

### Patch Changes

- fix: CompatibilitypTable 语法错误

## 1.6.35

### Patch Changes

- feat: CompatibilityTable 支持 status
- Updated dependencies
  - vuepress-plugin-expandable-row@1.0.11

## 1.6.34

### Patch Changes

- feat: 调整 table tr、td padding 样式

## 1.6.33

### Patch Changes

- feat: 优化文档兼容性表格懒加载与显示

## 1.6.32

### Patch Changes

- fix: 页面滚动后使用搜索时搜索框不可见

## 1.6.31

### Patch Changes

- feat: 优化 toc-item ad 图片的显示效果

## 1.6.30

### Patch Changes

- refacor(navbar): 使用 css 变量替换直接修改 style 方案优化性能

## 1.6.29

### Patch Changes

- refactor: 重构二级导航匹配逻辑以修复匹配错误时表现

## 1.6.28

### Patch Changes

- feat: 删除 image crisp-edges 样式

## 1.6.27

### Patch Changes

- feat: 在 mobile 时隐藏仓库链接、语言配置多个时才显示切换语言

## 1.6.26

### Patch Changes

- feat: 调整 ads 样式

## 1.6.25

### Patch Changes

- feat: 右侧 toc 添加广告位

## 1.6.24

### Patch Changes

- feat: 支持 source frontmatter

## 1.6.23

### Patch Changes

- fix: 移动模式下一级菜单下拉样式异常

## 1.6.22

### Patch Changes

- feat: 优化 navbar 结构; 多语言配置可为空
- feat: repo config

## 1.6.21

### Patch Changes

- feat: update attendance message format in SiderBarBottom component
- feat: 优化 navbar 样式

## 1.6.20

### Patch Changes

- fix: 搜索时有滚动条
- fix: algolia 搜索有结果时但显示文案显示异常

## 1.6.19

### Patch Changes

- fix: 问 AI 用户输入没有 ``` 包裹的 html 代码时显示异常
  feat: 优化用户消息显示速度
  feat: 优化用户信息显示

## 1.6.18

### Patch Changes

- feat: 优化搜索体验
- fix: 修复点击事件 positions 不正确

## 1.6.17

### Patch Changes

- feat: Algolia 搜索结果点击事件分析

## 1.6.16

### Patch Changes

- fix: 在 uni-app-x 下搜索到 uni-app 文档 plugin 内容时跳转 404

## 1.6.15

### Patch Changes

- feat: 搜索结果使用当前 origin
- a252012: feat: 自定义 code 添加圆角

## 1.6.13

### Patch Changes

- feat: 改进 navbar 显示

## 1.6.12

### Patch Changes

- fix: 兼容旧版 AI 回答数据

## 1.6.11

### Patch Changes

- feat: 提高 Popover 的 z-index
  feat: Popover 组件支持鼠标 hover 弹出不隐藏
  feat: AI 回答支持赞、踩

## 1.6.10

### Patch Changes

- feat: 更新请求 url
  fix: input 输入错误判断逻辑

## 1.6.9

### Patch Changes

- fix: 问 AI 限制中文时判断条件错误

## 1.6.8

### Patch Changes

- feat: 问 AI 添加限制: 要有中文

## 1.6.7

### Patch Changes

- fix: AI 回答 code 代码颜色
  feat: 搜索结果 AI 回答限制必须有中文

## 1.6.6

### Patch Changes

- fix: AI 回答 md 格式异常

## 1.6.5

### Patch Changes

- feat: 调整输入框样式，使用绝对定位
  feat: 限制 AI 输入的字符长度

## 1.6.4

### Patch Changes

- style: 调整 AI 回答样式
  fix: `1.` 等序号 marked 解析失败

## 1.6.3

### Patch Changes

- fix: vue 显示不高亮
- feat: 问 AI 添加上下文
- feat: 搜索结果添加 AI 回答

## 1.6.2

### Patch Changes

- fix: marked 版本过高导致 build error

## 1.6.1

### Patch Changes

- feat: 调整 AI 信息样式，容器宽度跟随文字
  feat：调整搜索结果样式

## 1.6.0

### Minor Changes

- feat: 支持 AI

## 1.5.4

### Patch Changes

- fix: 问答社区、插件市场搜索结果样式失效
  chore: 分离 animation 样式

## 1.5.3

### Patch Changes

- feat: 弹出时添加动画
  feat: 搜索时重置搜索结果滚动条

## 1.5.2

### Patch Changes

- feat: 调整 search footer

## 1.5.1

### Patch Changes

- feat: 调整搜索页样式

## 1.5.0

### Minor Changes

- fix: 优化爬虫获取 H 标签

## 1.4.44

### Patch Changes

- Updated dependencies
  - vuepress-plugin-noscript-code@1.0.2

## 1.4.43

### Patch Changes

- Updated dependencies
  - vuepress-plugin-noscript-code@1.0.1

## 1.4.42

### Patch Changes

- feat: 新增 vuepress-plugin-noscript-code

## 1.4.41

### Patch Changes

- feat: 使用 SourceCode container 如果页面上没有 title 则改写 document.title

## 1.4.40

### Patch Changes

- feat: 新增 container sourceCode

## 1.4.39

### Patch Changes

- feat: 调整导航栏样式

## 1.4.38

### Patch Changes

- feat: 代码预览 web 示例 iframe 使用 lazy 加载

## 1.4.36

### Patch Changes

- fix: 优化在移动设备上侧边栏的显示效果

## 1.4.35

### Patch Changes

- chore: 移除无用代码

## 1.4.34

### Patch Changes

- feat: search 使用 extraFacetFilters 配置
