# Eagle Lottie Preview Plugin - Vue 3 版本

这是 Eagle Lottie 预览插件的 Vue 3 重写版本，使用现代化的技术栈重构了整个项目。

## 技术栈

- **Vue 3** - 使用 Composition API
- **Vite** - 快速的构建工具
- **Lottie-web** - Lottie 动画渲染
- **JSZip** - ZIP 文件解压
- **Canvas** - 缩略图生成

## 项目结构

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
│   ├── lottie.js
│   └── lottie-zip.js
├── utils/                         # 工具函数
├── images/                        # 图片资源
├── lottie.html                   # JSON 查看器入口
├── lottie-zip.html               # ZIP 查看器入口
├── manifest.json                 # Eagle 插件配置
├── logo.png                      # 插件图标
└── vite.config.js                # Vite 配置
```

## 主要改进

### 1. 组件化架构
- 使用 Vue 3 的 Composition API 重写
- 核心播放器组件 `LottiePlayer.vue` 可复用
- 清晰的组件层次结构

### 2. 响应式状态管理
- 使用 Vue 的响应式系统管理播放状态
- 自动更新 UI，无需手动 DOM 操作

### 3. 现代化构建
- Vite 提供快速的开发体验
- 优化的生产构建
- 自动代码分割

### 4. 更好的代码组织
- 分离的视图组件
- 可维护的代码结构
- TypeScript 友好（可选）

## 开发

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

## 功能特性

### LottiePlayer 组件

核心播放器组件，提供以下功能：

- ✅ 播放/暂停控制
- ✅ 帧进退控制
- ✅ 进度条拖动
- ✅ 速度调节（0.5x, 1x, 1.5x, 2x）
- ✅ 全屏支持
- ✅ 键盘快捷键（空格：播放/暂停，左右箭头：帧进退）
- ✅ 自适应尺寸
- ✅ 加载状态显示
- ✅ 错误处理

### JSON 查看器

- 支持标准 Lottie JSON 文件
- 自动加载动画
- 显示动画尺寸信息

### ZIP 查看器

- 支持包含外部图片资源的 Lottie ZIP 包
- 自动解压并处理资源
- 将外部图片转换为 Base64 内嵌
- 智能匹配图片路径
- 显示 ZIP 标识

### 缩略图生成

- 使用 SVG 渲染生成高质量缩略图
- 支持透明背景
- 小尺寸文件自动 2x 放大
- 播放按钮图标

## 使用方法

### 在 Eagle 中安装

1. 构建项目：`npm run build`
2. 将 `dist/` 目录中的所有文件复制到 Eagle 插件目录
3. 在 Eagle 中重新加载插件

### URL 参数

**JSON 查看器：**
```
lottie.html?path=/path/to/animation.json
```

**ZIP 查看器：**
```
lottie-zip.html?path=/path/to/animation.zip
```

## 与原版的区别

| 特性 | 原版 | Vue 3 版 |
|------|------|----------|
| 框架 | 原生 JavaScript | Vue 3 |
| 状态管理 | 手动 DOM 操作 | 响应式系统 |
| 代码组织 | 单文件 HTML | 组件化 |
| 构建工具 | 无 | Vite |
| 开发体验 | 基础 | 热重载、快速构建 |
| 可维护性 | 中等 | 高 |
| 扩展性 | 有限 | 良好 |

## 系统要求

- Node.js 14.x 或更高版本
- npm 或 yarn
- Canvas 依赖（用于缩略图生成）

### Canvas 安装

**macOS:**
```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

**Windows:**
通常会自动处理，如遇问题请确保安装了 Visual Studio Build Tools

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

与原项目保持一致

## 致谢

- 原始项目：eagle-lottie-preview
- 特别感谢 @Lionel 为本插件提供图标设计和封面UI支持
