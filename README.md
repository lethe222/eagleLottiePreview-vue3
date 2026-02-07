# Eagle Lottie Preview Plugin - Vue 3 版本

## 这是 Eagle Lottie 预览插件的 Vue 3 重写版本，使用现代化的技术栈重构了整个项目。

### 修改内容

1. 修复初次播放未从第 0 帧开始的问题
   - 原因 ：Lottie 加载完成后默认可能停留在某一帧或并未重置到起点。
   - 解决 ：在 DOMLoaded 事件中添加了 animation.value.goToAndPlay(0, true) ，强制从头开始播放。

2. 优化进度条样式
   - 圆角轨道 ：进度条背景和填充部分都增加了 border-radius: 3px ，视觉更柔和。
   - 圆形播放点 ：在进度条末端添加了一个白色的圆形指示器（Handle），并带有轻微阴影，方便拖拽和查看当前进度。
   - 加粗 ：将进度条高度从 4px 增加到 6px，提升操作手感。
3. 优化进度条问题，调整按钮视觉效果

## ⚠️ Eagle/Electron 插件开发铁律

> **如果你正在开发 Eagle 或 Electron 插件，请务必记住这条铁律：**

### 🎯 核心原则

- **纯逻辑计算**（如重命名文件、数据处理）→ 在 Node.js 里做
- **图形渲染**（如生成缩略图、格式转换、Canvas 操作）→ **永远不要在 Node.js 里模拟浏览器**

## ✨ 核心特性

### 🎬 Lottie 动画播放器

- 播放/暂停控制
- 帧进退控制
- 进度条拖动
- 速度调节（0.5x, 1x, 1.5x, 2x）
- 全屏支持
- 键盘快捷键（空格：播放/暂停，左右箭头：帧进退）
- 自适应尺寸
- 加载状态显示

### 📦 文件格式支持

- **JSON 文件** - 标准 Lottie JSON 格式
- **ZIP 文件** - 包含外部图片资源的 Lottie ZIP 包
  - 自动解压并处理资源
  - 智能匹配图片路径

## 🛠️ 技术栈

- **Vue 3** - 使用 Composition API
- **Vite** - 快速的构建工具
- **Lottie-web** - Lottie 动画渲染
- **JSZip** - ZIP 文件解压
- **Puppeteer-Core** - 轻量级浏览器自动化（缩略图生成）

---

## 📁 项目结构

```
eagle-lottie-preview-vue/
├── src/
│   ├── components/
│   │   └── LottiePlayer.vue      # 核心播放器组件
│   ├── views/
│   │   ├── LottieViewer.vue      # JSON 文件查看器
│   │   └── LottieZipViewer.vue   # ZIP 文件查看器
│   ├── lottie-main.js            # JSON 入口
│   ├── lottie-zip-main.js        # ZIP 入口
│   └── style.css                 # 全局样式
├── thumbnail/                     # 缩略图生成脚本
│   ├── renderer.cjs              # 核心渲染引擎（Puppeteer-Core）
│   ├── lottie-render.cjs         # JSON 缩略图生成
│   └── lottie-zip.cjs            # ZIP 缩略图生成
├── utils/                         # 工具函数
├── lottie.html                   # JSON 查看器入口
├── lottie-zip.html               # ZIP 查看器入口
├── manifest.json                 # Eagle 插件配置
├── logo.png                      # 插件图标
└── vite.config.js                # Vite 配置
```

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

构建后的文件会输出到 `dist/` 目录，包含：

- `viewer/lottie.html` - JSON 查看器
- `viewer/lottie-zip.html` - ZIP 查看器
- `thumbnail/` - 缩略图生成脚本
- `manifest.json` - 插件配置
- 其他资源文件

### 在 Eagle 中安装

1. 构建项目：`npm run build`
2. 将 `dist/` 目录中的所有文件复制到 Eagle 插件目录
3. 在 Eagle 中重新加载插件

---

## 📊 与原版的区别

| 特性         | 原版                     | Vue 3 版                    |
| ------------ | ------------------------ | --------------------------- |
| 框架         | 原生 JavaScript          | Vue 3                       |
| 状态管理     | 手动 DOM 操作            | 响应式系统                  |
| 代码组织     | 单文件 HTML              | 组件化                      |
| 构建工具     | 无                       | Vite                        |
| 缩略图方案   | Canvas/JSDOM/Puppeteer   | Puppeteer-Core + 本地浏览器 |
| 安装复杂度   | 高（需要编译原生模块）   | 低（纯 JS，无需编译）       |
| 跨平台稳定性 | 中等（Windows 易出问题） | 高（自动查找系统浏览器）    |
| 开发体验     | 基础                     | 热重载、快速构建            |
| 可维护性     | 中等                     | 高                          |
| 扩展性       | 有限                     | 良好                        |

---

## 💻 系统要求

### 基本要求

- Node.js 14.x 或更高版本
- npm 或 yarn

### 浏览器要求（用于缩略图生成）

**Windows:**

- Windows 10/11 自带 Edge 浏览器（自动检测）
- 或安装 Chrome 浏览器

**macOS:**

- Chrome 浏览器（推荐）
- 或 Edge 浏览器
- 或 Chromium

插件会自动查找并使用系统浏览器，无需手动配置。

---

## 🔧 故障排除

### 启用/禁用调试日志

默认情况下，调试日志文件生成已**禁用**，只在控制台输出日志。

如果需要启用桌面日志文件（用于调试问题），请修改 `thumbnail/renderer.cjs` 文件：

```javascript
// 在文件顶部找到这一行（第 8 行左右）
const ENABLE_DEBUG_LOG = false; // 改为 true 启用日志文件
```

启用后，每次生成缩略图时会在桌面创建 `lottie-debug-*.txt` 文件，包含详细的调试信息。

### 缩略图生成失败

如果缩略图生成失败，请检查：

1. **启用调试日志**：将 `ENABLE_DEBUG_LOG` 设置为 `true`，查看桌面上的 `lottie-debug-*.txt` 文件
2. **确认浏览器已安装**：Windows 需要 Edge 或 Chrome，macOS 需要 Chrome
3. **检查浏览器路径**：日志中会显示查找的浏览器路径
4. **查看控制台输出**：即使禁用日志文件，控制台仍会输出调试信息

### 常见问题

**Q: 桌面上有很多 lottie-debug-\*.txt 文件怎么办？**
A: 这些是调试日志文件。如果不需要调试，将 `ENABLE_DEBUG_LOG` 设置为 `false` 即可停止生成。已生成的文件可以手动删除。

---

## 📄 许可证

与原项目保持一致

---

## 🙏 致谢

- 特别感谢 @Lionel 为本插件提供图标设计和封面UI支持
- 感谢匿名大佬提供的方向指导
