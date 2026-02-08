#!/usr/bin/env node

/**
 * 构建后处理脚本
 * 在 dist 目录中安装生产依赖
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");

console.log("=".repeat(60));
console.log("安装生产依赖到 dist 目录");
console.log("=".repeat(60));

// 检查 dist 目录是否存在
if (!fs.existsSync(distDir)) {
  console.error("❌ dist 目录不存在，请先运行 npm run build");
  process.exit(1);
}

// 检查 package.json 是否已复制
const distPackageJson = path.join(distDir, "package.json");
if (!fs.existsSync(distPackageJson)) {
  console.log("复制 package.json 到 dist...");
  fs.copyFileSync(path.join(__dirname, "package.json"), distPackageJson);
}

// 清理旧的 node_modules (如果存在)
const distNodeModules = path.join(distDir, "node_modules");
if (fs.existsSync(distNodeModules)) {
  console.log("清理 dist/node_modules...");
  fs.rmSync(distNodeModules, { recursive: true, force: true });
}

// 清理不需要的文件
console.log("清理不需要的文件...");
const viteSvg = path.join(distDir, "vite.svg");
if (fs.existsSync(viteSvg)) {
  fs.unlinkSync(viteSvg);
  console.log("✓ 已删除 vite.svg");
}

// 在 dist 目录中安装生产依赖
console.log("\n安装生产依赖...");
try {
  execSync("npm install --production --no-package-lock", {
    cwd: distDir,
    stdio: "inherit",
  });
  console.log("✓ 依赖安装完成");
} catch (error) {
  console.error("❌ 依赖安装失败:", error.message);
  process.exit(1);
}

// 优化：删除不必要的文件以减小体积
console.log("\n优化插件体积...");
const filesToDelete = [
  // lottie-web: 只保留 lottie.min.js，删除其他变体
  "node_modules/lottie-web/build/player/lottie.js",
  "node_modules/lottie-web/build/player/lottie_canvas.js",
  "node_modules/lottie-web/build/player/lottie_canvas.min.js",
  "node_modules/lottie-web/build/player/lottie_canvas_worker.js",
  "node_modules/lottie-web/build/player/lottie_canvas_worker.min.js",
  "node_modules/lottie-web/build/player/lottie_html.js",
  "node_modules/lottie-web/build/player/lottie_html.min.js",
  "node_modules/lottie-web/build/player/lottie_light.js",
  "node_modules/lottie-web/build/player/lottie_light.min.js",
  "node_modules/lottie-web/build/player/lottie_light_canvas.js",
  "node_modules/lottie-web/build/player/lottie_light_canvas.min.js",
  "node_modules/lottie-web/build/player/lottie_light_html.js",
  "node_modules/lottie-web/build/player/lottie_light_html.min.js",
  "node_modules/lottie-web/build/player/lottie_svg.js",
  "node_modules/lottie-web/build/player/lottie_svg.min.js",
  "node_modules/lottie-web/build/player/lottie_worker.js",
  "node_modules/lottie-web/build/player/lottie_worker.min.js",
];

const dirsToDelete = [
  "node_modules/lottie-web/build/player/esm",
  "node_modules/lottie-web/build/player/cjs",
  "node_modules/lottie-web/demo",
  "node_modules/lottie-web/docs",
  "node_modules/lottie-web/player",
  "node_modules/lottie-web/test",
  "node_modules/lottie-web/tasks",
  "node_modules/puppeteer-core/.github",
  "node_modules/puppeteer-core/src",
  "node_modules/@vue",
  "node_modules/vue",
  "node_modules/@types",
  "node_modules/csstype",
];

let savedSpace = 0;

filesToDelete.forEach((file) => {
  const fullPath = path.join(distDir, file);
  if (fs.existsSync(fullPath)) {
    const stats = fs.statSync(fullPath);
    savedSpace += stats.size;
    fs.unlinkSync(fullPath);
  }
});

dirsToDelete.forEach((dir) => {
  const fullPath = path.join(distDir, dir);
  if (fs.existsSync(fullPath)) {
    const getDirSize = (dirPath) => {
      let size = 0;
      const files = fs.readdirSync(dirPath);
      files.forEach((file) => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          size += getDirSize(filePath);
        } else {
          size += stats.size;
        }
      });
      return size;
    };
    savedSpace += getDirSize(fullPath);
    fs.rmSync(fullPath, { recursive: true, force: true });
  }
});

console.log(`✓ 已优化，节省空间: ${(savedSpace / 1024 / 1024).toFixed(2)} MB`);

// 显示最终大小
const getFinalSize = (dirPath) => {
  let size = 0;
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      size += getFinalSize(filePath);
    } else {
      size += stats.size;
    }
  });
  return size;
};

const finalSize = getFinalSize(distDir);
console.log(`最终插件大小: ${(finalSize / 1024 / 1024).toFixed(2)} MB`);

console.log("\n" + "=".repeat(60));
console.log("✅ 构建完成！");
console.log("=".repeat(60));
