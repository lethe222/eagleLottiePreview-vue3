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

console.log("\n" + "=".repeat(60));
console.log("✅ 构建完成！(跳过 node_modules 安装)");
console.log("=".repeat(60));
