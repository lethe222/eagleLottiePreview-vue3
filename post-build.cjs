#!/usr/bin/env node

/**
 * 构建后处理脚本
 * 根据环境变量决定是否安装依赖
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "dist");
const buildMode = process.env.BUILD_MODE || 'dev';
const isRelease = buildMode === 'release';
const isVendored = buildMode === 'vendored';

console.log("=".repeat(60));
if (isRelease) {
  console.log("构建发布版本（不包含 node_modules）");
} else if (isVendored) {
  console.log("构建 Vendored 版本（包含精简依赖）");
} else {
  console.log("构建开发版本（包含完整 node_modules）");
}
console.log("=".repeat(60));

// 检查 dist 目录是否存在
if (!fs.existsSync(distDir)) {
  console.error("❌ dist 目录不存在，请先运行 npm run build");
  process.exit(1);
}

// 创建精简的 package.json（只包含运行时依赖）
const distPackageJson = path.join(distDir, "package.json");
console.log("创建精简的 package.json...");
const minimalPackageJson = {
  name: "eagle-lottie-preview",
  version: "2.1.0",
  description: "Eagle Lottie 预览插件",
  dependencies: {
    "adm-zip": "^0.5.16",
    "lottie-web": "^5.13.0",
    "puppeteer-core": "^24.37.2"
  }
};
fs.writeFileSync(distPackageJson, JSON.stringify(minimalPackageJson, null, 2));
console.log("✓ 已创建精简的 package.json");

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

if (isRelease) {
  // 发布模式：不安装依赖，让 Eagle 自动安装
  console.log("\n✓ 发布模式：跳过依赖安装");
  console.log("提示：Eagle 会在安装插件时自动安装依赖");
} else if (isVendored) {
  // Vendored 模式：手动复制精简的依赖文件
  console.log("\n创建 Vendored 依赖...");

  // 1. 复制 lottie.min.js 到 thumbnail 目录
  const lottieSource = path.join(__dirname, "node_modules/lottie-web/build/player/lottie.min.js");
  const lottieDest = path.join(distDir, "thumbnail/lottie.min.js");
  if (fs.existsSync(lottieSource)) {
    fs.copyFileSync(lottieSource, lottieDest);
    console.log("✓ 已复制 lottie.min.js");
  } else {
    console.error("❌ 找不到 lottie.min.js");
    process.exit(1);
  }

  // 2. 复制 adm-zip（完整模块，很小只有 164KB）
  const admZipSource = path.join(__dirname, "node_modules/adm-zip");
  const admZipDest = path.join(distDir, "node_modules/adm-zip");
  if (fs.existsSync(admZipSource)) {
    fs.mkdirSync(path.dirname(admZipDest), { recursive: true });
    fs.cpSync(admZipSource, admZipDest, { recursive: true });
    console.log("✓ 已复制 adm-zip");
  } else {
    console.error("❌ 找不到 adm-zip");
    process.exit(1);
  }

  // 3. 复制 puppeteer-core（只复制必要的文件）
  const puppeteerSource = path.join(__dirname, "node_modules/puppeteer-core");
  const puppeteerDest = path.join(distDir, "node_modules/puppeteer-core");
  if (fs.existsSync(puppeteerSource)) {
    fs.mkdirSync(puppeteerDest, { recursive: true });

    // 复制 package.json
    fs.copyFileSync(
      path.join(puppeteerSource, "package.json"),
      path.join(puppeteerDest, "package.json")
    );

    // 复制 lib 目录（编译后的代码）
    fs.cpSync(
      path.join(puppeteerSource, "lib"),
      path.join(puppeteerDest, "lib"),
      { recursive: true }
    );

    console.log("✓ 已复制 puppeteer-core");
  } else {
    console.error("❌ 找不到 puppeteer-core");
    process.exit(1);
  }

  // 4. 复制 puppeteer-core 的依赖
  console.log("复制 puppeteer-core 依赖...");
  const puppeteerDeps = [
    "@puppeteer/browsers",
    "chromium-bidi",
    "debug",
    "devtools-protocol",
    "ws"
  ];

  puppeteerDeps.forEach(dep => {
    const depSource = path.join(__dirname, "node_modules", dep);
    const depDest = path.join(distDir, "node_modules", dep);
    if (fs.existsSync(depSource)) {
      fs.cpSync(depSource, depDest, { recursive: true });
      console.log(`  ✓ 已复制 ${dep}`);
    }
  });

  console.log("✓ Vendored 依赖创建完成");
} else {
  // 开发模式：安装依赖并优化
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
}

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
