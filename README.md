# Eagle Lottie Preview Plugin - Vue 3 版本

这是 Eagle Lottie 预览插件的 Vue 3 重写版本，使用现代化的技术栈重构了整个项目，并采用 JSDOM 在服务端渲染 Lottie 动画，以生成高质量的预览图。

## 技术栈

- **Vue 3** - 使用 Composition API
- **Vite** - 快速的构建工具
- **Lottie-web** - Lottie 动画渲染
- **JSZip** - ZIP 文件解压（支持复杂的 ZIP 包结构）
- **JSDOM** - 在 Node.js 环境中模拟浏览器环境，用于服务端渲染 Lottie
- **@napi-rs/canvas** - 将服务端渲染的 SVG 转换为 PNG 缩略图（预编译版本，无需本地编译环境）

## 项目结构

```
eagle-lottie-preview-vue/
├── src/
│   ├── components/
│   │   └── LottiePlayer.vue      # 核心播放器组件
│   ├── App.vue                   # 开发环境下的主应用组件
│   └── main.js                   # 开发环境入口
├── thumbnail/                    # 缩略图生成脚本
│   ├── lottie.js                 # (核心) 使用 JSDOM + lottie-web 渲染
│   └── lottie-zip.js
├── dist/                         # 构建输出目录 (用于安装到 Eagle)
├── public/                       # Vite public 目录
├── images/                       # 插件图标等资源
├── index.html                    # 开发环境入口 HTML
├── manifest.json                 # Eagle 插件配置
├── package.json                  # 项目依赖和脚本
└── vite.config.js                # Vite 配置
```

## 主要改进

### 1. 高质量缩略图

- **服务端渲染**：使用 `JSDOM` + `lottie-web` 在 Node.js 环境中真实渲染 Lottie 动画的第一帧或中间帧。
- **三级降级机制**：
  1.  **首选**：JSDOM 渲染真实 Lottie 内容。
  2.  **备用**：如果 JSDOM 失败，使用 `Canvas` 绘制一个静态的播放按钮。
  3.  **保底**：如果 Canvas 也失败，生成一个 1x1 的最小 PNG，避免插件出错。
- **智能缩放**：对于小于 250x250 的小尺寸动画，自动将缩略图放大 2 倍，以获得更清晰的预览。

### 2. 现代化前端架构

- **Vue 3 & Vite**：享受 Composition API 带来的更佳代码组织能力和 Vite 提供的极致开发速度。
- **组件化**：核心播放器 `LottiePlayer.vue` 是一个独立的、可复用的组件，包含了所有播放逻辑。

### 3. 简化的开发流程

- **统一开发入口**：在 `src/App.vue` 中即可调试所有功能，无需在多个 HTML 文件间切换。
- **强大的构建脚本**：`pnpm build` 命令会自动完成所有操作：Vite 构建、资源拷贝、路径修复，并生成可直接用于 Eagle 的 `dist` 文件夹。

## 开发

### 安装依赖

推荐使用 `pnpm` 进行依赖管理。

```bash
pnpm install
```

### 开发模式

运行以下命令，Vite 会启动一个热重载的开发服务器。在浏览器中打开对应地址即可进行开发和调试。

```bash
pnpm dev
```

### 构建生产版本

此命令将为插件创建一个生产版本，所有文件都会被正确处理并放置在 `dist/` 目录中。

```bash
pnpm build
```

`dist/` 目录是最终要安装到 Eagle 的插件包。

## 功能特性

### LottiePlayer 组件

核心播放器组件，提供以下功能：

- ✅ 播放/暂停、逐帧进退、进度条拖动
- ✅ 速度调节（0.5x, 1x, 1.5x, 2x）
- ✅ 全屏模式
- ✅ 键盘快捷键（空格、左右箭头）
- ✅ 动画尺寸、帧率、体积信息显示
- ✅ 背景色切换
- ✅ 加载状态和错误处理

### 缩略图生成 (Thumbnail)

- **真实内容预览**：通过服务端渲染，缩略图直接显示 Lottie 动画的实际内容。
- **ZIP 包支持**：`lottie-zip.js` 脚本能够处理包含外部图片资源的 Lottie 压缩包，自动解压并转换外部图片为内嵌 Base64。

### ZIP 包支持说明

本插件完整支持 Lottie ZIP 包（包含外部图片资源的动画）：

- ✅ **智能资源匹配**：自动查找并匹配 JSON 中引用的图片文件，支持多种路径格式
- ✅ **大小写不敏感**：兼容 Windows 和 macOS 的文件命名差异
- ✅ **多种目录结构**：支持 `images/`、`img/`、`assets/` 等常见目录结构
- ✅ **自动 Base64 转换**：将外部图片转换为内嵌格式，确保播放流畅
- ✅ **详细日志**：开发者工具中可查看完整的资源处理过程

**ZIP 包结构示例：**

```
animation.zip
├── data.json          # Lottie 动画数据
└── images/            # 图片资源目录
    ├── img_0.png
    ├── img_1.png
    └── img_2.png
```

## 使用方法

### 在 Eagle 中安装

1.  **构建项目**:
    ```bash
    pnpm build
    ```
2.  **安装插件**:
    - 打开 Eagle
    - 选择「偏好设置」→「插件」→「安装」
    - 在弹出的文件选择框中，选择项目中的 `dist` 文件夹。
3.  **完成**: Eagle 会自动复制插件并加载。现在将 Lottie 文件拖入 Eagle 即可看到效果。

## 系统要求

- Node.js 16.x 或更高版本
- `pnpm` (推荐)

> 🎉 **无需本地编译**：
>
> 本项目已升级使用 `@napi-rs/canvas`，它预置了 Windows、macOS 和 Linux 的二进制文件。
> Windows 用户 **不再需要** 安装 Visual Studio C++ 环境或其他复杂的系统依赖。任何安装了 Node.js 的机器都可以直接构建本插件。

## 常见问题

### ZIP 包显示空白？

如果部分 ZIP 包显示空白，请检查以下几点：

1.  **打开浏览器开发者工具**：在 Eagle 中右键点击预览窗口，选择「检查元素」或「开发者工具」。
2.  **查看控制台日志**：会显示资源加载的详细信息，包括哪些图片找到了，哪些没找到。
3.  **检查 ZIP 包结构**：确保 JSON 文件和图片文件都在 ZIP 包内，且路径引用正确。
4.  **常见问题**：
    - 图片文件名大小写不匹配（Windows 不敏感，但某些导出工具可能有问题）
    - JSON 中的路径使用了反斜杠 `\` 而不是正斜杠 `/`
    - 图片文件在子目录中，但 JSON 引用的路径不正确

### 缩略图生成失败？

缩略图生成有三级降级机制：

1.  **首选**：JSDOM 渲染真实 Lottie 内容
2.  **备用**：Canvas 绘制静态播放按钮
3.  **保底**：生成 1x1 最小 PNG

即使 JSDOM 失败，也能保证插件正常工作，只是缩略图会显示为播放按钮图标。

### 如何调试？

在 `manifest.json` 中临时开启开发者工具：

```json
{
  "devTools": true
}
```

重新构建并安装插件后，预览窗口会自动打开开发者工具，方便查看详细日志。

- 原始项目：[eagle-lottie-preview](https://github.com/...)
- 特别感谢 @Lionel 为本插件提供图标设计和封面UI支持

## 2026-01 修复说明

### ZIP 包嵌套目录兼容性修复

- 修复了部分 Lottie ZIP 包（如 `xxx.zip/子目录/data.json` + `xxx.zip/子目录/images/`）在 Eagle 中显示空白的问题。
- 现在插件会自动识别 JSON 文件的实际目录，并基于该目录优先查找图片资源（如 `images/img_0.png` 实际对应 `子目录/images/img_0.png`）。
- 支持多级嵌套、相对路径、绝对路径、文件名等多种资源引用方式。
- 详细日志会输出所有尝试过的路径，方便排查特殊包结构。

**示例：**

```
动画包.zip
└── lottie_1747386060977/
    ├── data.json
    └── images/
        ├── img_0.png
        └── img_1.png
```

只要 JSON 和图片在同一子目录下，引用 `images/img_0.png` 就能被正确识别，无需调整包结构。

- 2026-01：后端缩略图生成脚本（thumbnail/lottie-zip.cjs）同步支持 ZIP 包嵌套目录和多路径查找，确保 Eagle 自动生成的缩略图与前端预览一致。
- 现在无论 ZIP 包结构多复杂，缩略图和预览都能正确显示动画内容。


## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

与原项目保持一致

## 致谢

- 原始项目：eagle-lottie-preview
- 特别感谢 @Lionel 为本插件提供图标设计和封面UI支持
