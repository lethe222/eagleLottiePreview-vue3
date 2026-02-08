function checkDependencies() {
  const results = {
    canvas: { available: false, error: null },
    puppeteer: { available: false, error: null },
    jsdom: { available: false, error: null },
    lottieWeb: { available: false, error: null },
    admZip: { available: false, error: null },
  };

  try {
    require("canvas");
    results.canvas.available = true;
  } catch (e) {
    results.canvas.error = e.message;
  }

  try {
    require("puppeteer");
    results.puppeteer.available = true;
  } catch (e) {
    results.puppeteer.error = e.message;
  }

  try {
    require("jsdom");
    results.jsdom.available = true;
  } catch (e) {
    results.jsdom.error = e.message;
  }

  try {
    require("lottie-web");
    results.lottieWeb.available = true;
  } catch (e) {
    results.lottieWeb.error = e.message;
  }

  try {
    require("adm-zip");
    results.admZip.available = true;
  } catch (e) {
    results.admZip.error = e.message;
  }

  return results;
}

function printDependencyStatus() {
  console.log("=== Eagle Lottie 插件依赖检查 ===\n");

  const results = checkDependencies();

  const statusSymbol = (available) => (available ? "✅" : "❌");

  console.log("核心依赖:");
  console.log(`  ${statusSymbol(results.canvas.available)} Canvas (图片渲染)`);
  if (!results.canvas.available) {
    console.log(`     错误: ${results.canvas.error}`);
    console.log("     解决方案: pnpm install canvas");
    console.log(
      "     macOS 需要先安装系统依赖: brew install pkg-config cairo pango libpng jpeg giflib librsvg",
    );
  }

  console.log(
    `  ${statusSymbol(results.lottieWeb.available)} lottie-web (动画渲染)`,
  );
  if (!results.lottieWeb.available) {
    console.log(`     错误: ${results.lottieWeb.error}`);
    console.log("     解决方案: pnpm install lottie-web");
  }

  console.log(`  ${statusSymbol(results.jsdom.available)} JSDOM (DOM 模拟)`);
  if (!results.jsdom.available) {
    console.log(`     错误: ${results.jsdom.error}`);
    console.log("     解决方案: pnpm install jsdom");
  }

  console.log(`  ${statusSymbol(results.admZip.available)} adm-zip (ZIP 解压)`);
  if (!results.admZip.available) {
    console.log(`     错误: ${results.admZip.error}`);
    console.log("     解决方案: pnpm install adm-zip");
  }

  console.log("\n备用依赖:");
  console.log(
    `  ${statusSymbol(results.puppeteer.available)} Puppeteer (浏览器渲染)`,
  );
  if (!results.puppeteer.available) {
    console.log(`     错误: ${results.puppeteer.error}`);
    console.log("     解决方案: pnpm install puppeteer");
    console.log("     注意: Puppeteer 会下载 Chromium，可能需要较长时间");
  }

  console.log("\n渲染能力评估:");
  if (
    results.canvas.available &&
    results.lottieWeb.available &&
    results.jsdom.available
  ) {
    console.log("  ✅ 方案 1 (JSDOM + Canvas): 可用 - 推荐使用");
  } else {
    console.log("  ❌ 方案 1 (JSDOM + Canvas): 不可用");
  }

  if (results.puppeteer.available) {
    console.log("  ✅ 方案 2 (Puppeteer): 可用 - 备用方案");
  } else {
    console.log("  ⚠️  方案 2 (Puppeteer): 不可用 - 非必需");
  }

  if (results.canvas.available) {
    console.log("  ✅ 方案 3 (SVG 静态): 可用 - 降级方案");
  } else {
    console.log("  ❌ 方案 3 (SVG 静态): 不可用");
  }

  console.log("  ✅ 方案 4 (播放按钮): 始终可用 - 最终兜底\n");

  const allCoreAvailable =
    results.canvas.available &&
    results.lottieWeb.available &&
    results.jsdom.available &&
    results.admZip.available;

  if (allCoreAvailable) {
    console.log("✅ 所有核心依赖已安装，插件可以正常工作！\n");
    return true;
  } else {
    console.log("❌ 部分核心依赖缺失，请按照上述提示安装\n");
    return false;
  }
}

if (require.main === module) {
  const allOk = printDependencyStatus();
  process.exit(allOk ? 0 : 1);
}

module.exports = {
  checkDependencies,
  printDependencyStatus,
};
