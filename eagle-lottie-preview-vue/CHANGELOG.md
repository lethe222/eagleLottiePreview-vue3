# 修复日志

## 2026-01-31 - 缩略图渲染重构

### 🎯 核心改进

#### 1. 缩略图显示动画中间帧

- **之前**: 缩略图只显示静态播放按钮
- **现在**: 缩略图显示 Lottie 动画的中间帧（第 totalFrames/2 帧）
- **效果**: 用户可以直观看到动画内容，而不是统一的播放按钮

#### 2. 多层降级渲染策略

实现了 4 层降级方案，确保极端情况下也能生成缩略图：

```
方案 1: JSDOM + Canvas + lottie-web (5秒超时)
  ↓ 失败
方案 2: Puppeteer 无头浏览器 (10秒超时)
  ↓ 失败
方案 3: SVG 静态渲染 (3秒超时)
  ↓ 失败
方案 4: 播放按钮 (最终兜底)
```

#### 3. 修复卡进度问题

- 移除所有 Promise 反模式（`async + new Promise`）
- 添加统一超时机制，避免无限卡住
- ZIP 解压添加 30 秒超时
- 总体缩略图生成限制在 15 秒内

#### 4. 优化 ZIP 文件处理

- **文件大小限制**: 50MB → 20MB（更合理）
- **改进路径匹配**: 支持多种路径组合（`images/`, `./`, 绝对路径等）
- **资源转换**: 自动将外部图片转为 Base64 内嵌
- **临时文件清理**: 确保解压后的临时文件被正确清理

### 📁 文件修改清单

#### 新增文件

- `thumbnail/renderer.cjs` - 统一渲染器，实现 4 层降级策略
- `thumbnail/check-deps.cjs` - 依赖检查脚本
- `test-thumbnail.js` - 缩略图生成测试脚本
- `CHANGELOG.md` - 本文件

#### 重构文件

- `thumbnail/lottie-render.cjs` - 使用统一渲染器，移除 Promise 反模式
- `thumbnail/lottie-zip.cjs` - 改进路径匹配，使用统一渲染器
- `utils/zip-util.cjs` - 添加大小限制和超时机制

### 🔧 技术细节

#### 渲染方案对比

| 方案               | 优点                   | 缺点               | 超时 | 使用场景 |
| ------------------ | ---------------------- | ------------------ | ---- | -------- |
| **JSDOM + Canvas** | 快速、轻量、无需浏览器 | 可能不兼容某些特效 | 5秒  | 主方案   |
| **Puppeteer**      | 100% 真实渲染          | 启动慢、资源占用高 | 10秒 | 备用方案 |
| **SVG 静态**       | 不依赖浏览器           | 只能渲染简单图层   | 3秒  | 降级方案 |
| **播放按钮**       | 永远不会失败           | 无法显示动画内容   | -    | 最终兜底 |

#### 性能预估

| 场景              | 预计耗时 | 降级路径           |
| ----------------- | -------- | ------------------ |
| **正常 JSON**     | 1-2 秒   | JSDOM 成功         |
| **复杂 JSON**     | 3-5 秒   | JSDOM 或 Puppeteer |
| **正常 ZIP**      | 2-4 秒   | 解压 + JSDOM       |
| **大 ZIP (15MB)** | 5-8 秒   | 解压 + Puppeteer   |
| **极端失败**      | < 1 秒   | 直接播放按钮       |

### 🧪 测试方法

#### 1. 检查依赖

```bash
cd /Users/chao/Desktop/github/eagle-lottie-preview/eagle-lottie-preview-vue
node thumbnail/check-deps.cjs
```

#### 2. 测试缩略图生成

```bash
# 测试 JSON 文件
node test-thumbnail.js ./test.json

# 测试 JSON 和 ZIP 文件
node test-thumbnail.js ./test.json ./test.zip
```

#### 3. 构建插件

```bash
pnpm build
```

### 📊 预期效果

#### 修复前

- ❌ 缩略图只显示播放按钮
- ❌ macOS/Windows 中 JSON 文件导入卡进度
- ❌ ZIP 文件可能因路径匹配失败无法显示图片
- ❌ 大 ZIP 文件可能导致解压超时

#### 修复后

- ✅ 缩略图显示动画中间帧
- ✅ 不再卡进度（最多 15 秒超时）
- ✅ ZIP 文件路径匹配更智能
- ✅ 20MB 大小限制，30 秒解压超时
- ✅ 极端情况下也能生成缩略图（降级到播放按钮）

### 🚀 下一步

1. 在 Eagle 中测试实际效果
2. 如有问题，查看 Eagle 日志中的详细错误信息
3. 根据日志调整超时时间或降级策略

### 📝 注意事项

- 首次运行可能需要等待 Puppeteer 下载 Chromium（如果使用方案 2）
- macOS 用户需要确保已安装 Canvas 所需的系统依赖：
  ```bash
  brew install pkg-config cairo pango libpng jpeg giflib librsvg
  ```
- 如果 JSDOM 渲染失败，会自动降级到 Puppeteer 或其他方案
- 所有渲染方案都会在控制台输出详细日志，便于调试

### 🐛 已知问题

- 某些使用高级特效（如 3D 变换、复杂遮罩）的 Lottie 动画可能在 JSDOM 中渲染失败，会自动降级到 Puppeteer
- Puppeteer 方案在某些系统上可能需要额外的权限配置

### 💡 建议

- 优先使用方案 1（JSDOM + Canvas），速度最快
- 如果经常遇到渲染失败，可以考虑直接使用 Puppeteer（修改 `renderer.cjs` 中的降级顺序）
- 对于简单的 Lottie 动画，方案 1 完全够用
