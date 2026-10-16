# @navfolio/plugin-markdown-layouts

为 Markdown 正文提供局部布局块：通用分栏和时间线。它只处理文章内的
内容结构，不负责博客页面、侧栏或主题模板的整体布局。

## 能力

- `columns`：两栏到六栏、数字比例、媒体列与窄屏堆叠。
- `timeline`：默认纵向，或支持横向连续阅读；横向超出正文宽度时可滚动。
- 列和事件内保留普通 Markdown，例如标题、图片、加粗、链接、列表和引用。
- 输出稳定、语义化的 `section`、`div`、`ol` 与 `li` 结构，供主题样式覆盖。

## 安装与接入

将插件加入 Navfolio 配置，并在全局样式中导入结构样式一次：

```ts
import { layoutPlugin } from '@navfolio/plugin-markdown-layouts';

export default defineNavfolioConfig({
  plugins: [layoutPlugin()],
});
```

```css
@import '@navfolio/plugin-markdown-layouts/styles.css';
```

`@navfolio/theme-default` 已内置同一组布局的主题样式；使用默认主题时不需要
重复导入。自定义主题应导入上面的结构样式，并按输出类名覆盖颜色和间距。

也可以直接作为 Astro 的 Remark 插件使用：

```ts
import remarkLayouts from '@navfolio/plugin-markdown-layouts';

export default defineConfig({
  markdown: {
    remarkPlugins: [remarkLayouts],
  },
});
```

## 分栏

指令行和结束行必须单独占一段。`cols` 可省略并由 `column` 数量推断；
显式填写时需要与列数一致。`ratio` 的数值数量也必须等于列数。
属性直接写在指令名后，并用空格分隔；不要使用 `{}` 包裹属性，否则 MDX
会把它当作 JavaScript 表达式交给 Acorn 解析。

```md
::: columns cols=2 ratio=1:2

::: column

## 左侧摘要

这里是普通 **Markdown** 内容。

:::

::: column

右侧可以包含更长的说明、列表或链接。

:::

:::
```

不写 `ratio` 时各栏等宽。Grid 默认会拉伸每个列容器到该行的最大高度；
只有主题为列容器添加边框或背景时，等高才会在视觉上显现。

### 媒体列与窄屏顺序

`media` 是列的内容语义，而不是另一种布局。它不会自动由图片推断，避免
把普通截图或行内插图误判为媒体列。窄屏时默认按源码顺序堆叠；设置
`mobile=media-first` 后，媒体列会移至前面。

```md
::: columns cols=2 ratio=3:2 mobile=media-first

::: column

_FIELD NOTE · 07_

## 在雾里记录颜色

图片与说明可以共享一个阅读单元。

:::

::: column media

![雾中的小屋](/images/field-note-07.jpg)

:::

:::
```

## 时间线

时间线包含按顺序排列的 `event`。事件可包含任意普通 Markdown 块。

```md
::: timeline

::: event date=2024.06

### 收集

把零散的链接与观察整理成素材库。

:::

::: event date=2025.01

### 发布

发布第一个公开、可阅读的版本。

:::

:::
```

横向时间线用于少量、连续的节点。其列表使用最小列宽；当内容超过文章
正文宽度时，浏览器会显示横向滚动条，而不是压缩文字或截断节点。

```md
::: timeline direction=horizontal

::: event date=2024.06

### 收集

:::

::: event date=2024.10

### 成形

:::

::: event date=2025.01

### 发布

:::

:::
```

## 响应式与主题

- `columns` 在 `720px` 以下堆叠为单列，媒体列可选地优先显示。
- 纵向时间线在所有设备保持纵向；横向时间线保留横向滚动，方便读取日期顺序。
- 基础样式只负责结构和可用性。默认主题通过 `.markdown-columns`、
  `.markdown-layout-column`、`.markdown-timeline`、`.markdown-timeline-list` 和
  `.markdown-timeline-event` 提供颜色、间距与时间节点视觉。

当前版本不支持将同类布局指令嵌套在 `column` 或 `event` 内；未闭合或结构不完整
的指令会原样保留，避免吞掉作者内容。
