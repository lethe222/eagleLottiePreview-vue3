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

// 清理旧的 node_modules
const distNodeModules = path.join(distDir, "node_modules");
if (fs.existsSync(distNodeModules)) {
  console.log("清理旧的 node_modules...");
  fs.rmSync(distNodeModules, { recursive: true, force: true });
}

// 清理不需要的文件
console.log("清理不需要的文件...");
const viteSvg = path.join(distDir, "vite.svg");
if (fs.existsSync(viteSvg)) {
  fs.unlinkSync(viteSvg);
  console.log("✓ 已删除 vite.svg");
}

try {
  console.log("\n使用 npm 安装依赖（避免 pnpm 符号链接问题）...");
  console.log("这可能需要几秒钟...\n");

  // 使用 npm 而不是 pnpm，避免符号链接问题
  execSync("npm install --omit=dev --legacy-peer-deps", {
    cwd: distDir,
    stdio: "inherit",
    env: {
      ...process.env,
      PUPPETEER_SKIP_DOWNLOAD: "true", // 跳过 Chromium 下载，使用系统浏览器
    },
  });

  console.log("\n✅ 依赖安装成功！");

  // 验证关键依赖
  const puppeteerCorePath = path.join(distNodeModules, "puppeteer-core");
  const lottieWebPath = path.join(distNodeModules, "lottie-web");

  if (fs.existsSync(puppeteerCorePath)) {
    console.log("✓ puppeteer-core 已安装");
  } else {
    console.warn("⚠️  puppeteer-core 未找到");
  }

  if (fs.existsSync(lottieWebPath)) {
    console.log("✓ lottie-web 已安装");
  } else {
    console.warn("⚠️  lottie-web 未找到");
  }

  console.log("✓ 使用系统浏览器（Edge/Chrome），无需下载 Chromium");

  console.log("\n" + "=".repeat(60));
  console.log("✅ 构建完成！dist 目录已准备好用于 Eagle");
  console.log("=".repeat(60));

} catch (error) {
  console.error("\n❌ 安装依赖失败:", error.message);
  console.error("\n尝试备用方案：复制根目录的 node_modules...");

  try {
    const rootNodeModules = path.join(__dirname, "node_modules");
    if (fs.existsSync(rootNodeModules)) {
      console.log("复制 node_modules（这可能需要一些时间）...");

      // 使用 cp 命令复制，保留符号链接
      execSync(`cp -RL "${rootNodeModules}" "${distDir}/"`, {
        stdio: "inherit",
      });

      console.log("✅ node_modules 复制成功");
    } else {
      throw new Error("根目录的 node_modules 不存在");
    }
  } catch (copyError) {
    console.error("❌ 备用方案也失败了:", copyError.message);
    console.error("\n请手动运行：");
    console.error("  cd dist && npm install --omit=dev");
    process.exit(1);
  }
}
