const fs = require("fs");
const os = require("os");
const path = require("path");
const puppeteer = require("puppeteer-core");

// ==================== 调试日志配置 ====================
// 设置为 false 可以禁用调试日志文件生成（只在控制台输出）
// 设置为 true 会在桌面生成 lottie-debug-*.txt 日志文件
const ENABLE_DEBUG_LOG = false;

const DEBUG_LOG_PATH = path.join(
  os.homedir(),
  "Desktop",
  `lottie-debug-${Date.now()}.txt`
);

function debugLog(message, level = "INFO") {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${level}] ${message}`;
  console.log(logLine);

  if (!ENABLE_DEBUG_LOG) return;

  try {
    fs.appendFileSync(DEBUG_LOG_PATH, logLine + "\n", "utf8");
  } catch (err) {
    console.error("写入调试日志失败:", err.message);
  }
}

function debugError(message, error) {
  debugLog(`${message}`, "ERROR");
  if (error) {
    debugLog(`  错误类型: ${error.name}`, "ERROR");
    debugLog(`  错误信息: ${error.message}`, "ERROR");
    if (error.stack) {
      error.stack.split("\n").forEach((line) => debugLog(`  ${line}`, "ERROR"));
    }
  }
}

function initDebugLog() {
  if (!ENABLE_DEBUG_LOG) return;

  const header = [
    "=".repeat(80),
    "Lottie 缩略图生成调试日志 - Puppeteer-Core 方案",
    `时间: ${new Date().toLocaleString("zh-CN")}`,
    `平台: ${os.platform()} ${os.release()}`,
    `架构: ${os.arch()}`,
    `Node 版本: ${process.version}`,
    `用户目录: ${os.homedir()}`,
    `日志文件: ${DEBUG_LOG_PATH}`,
    "=".repeat(80),
    "",
  ].join("\n");
  try {
    fs.writeFileSync(DEBUG_LOG_PATH, header + "\n", "utf8");
    console.log(`\n📝 调试日志已创建: ${DEBUG_LOG_PATH}\n`);
  } catch (err) {
    console.error("创建调试日志文件失败:", err.message);
  }
}

function finalizeDebugLog(success = true) {
  if (!ENABLE_DEBUG_LOG) return;

  const footer = [
    "",
    "=".repeat(80),
    `渲染结果: ${success ? "✅ 成功" : "❌ 失败"}`,
    `结束时间: ${new Date().toLocaleString("zh-CN")}`,
    "=".repeat(80),
  ].join("\n");
  try {
    fs.appendFileSync(DEBUG_LOG_PATH, footer + "\n", "utf8");
  } catch (err) {
    console.error("写入调试日志尾部失败:", err.message);
  }
}
// ==================== 调试日志结束 ====================

/**
 * 自动查找本地浏览器的函数 (优先找 Edge，因为 Windows 必有)
 */
function findBrowser() {
  const platform = os.platform();

  if (platform === "win32") {
    debugLog("[Browser] Windows 平台，查找本地浏览器...");
    const commonPaths = [
      // Edge (Windows 10/11 默认，优先级最高)
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
      path.join(
        os.homedir(),
        "AppData\\Local\\Microsoft\\Edge\\Application\\msedge.exe"
      ),
      // Chrome (作为备选)
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      path.join(
        os.homedir(),
        "AppData\\Local\\Google\\Chrome\\Application\\chrome.exe"
      ),
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        debugLog(`[Browser] ✅ 找到浏览器: ${p}`);
        return p;
      }
    }
    debugLog("[Browser] ❌ 未找到本地浏览器");
  } else if (platform === "darwin") {
    debugLog("[Browser] macOS 平台，查找本地浏览器...");
    const commonPaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ];

    for (const p of commonPaths) {
      if (fs.existsSync(p)) {
        debugLog(`[Browser] ✅ 找到浏览器: ${p}`);
        return p;
      }
    }
    debugLog("[Browser] ❌ 未找到本地浏览器");
  }

  return null;
}

/**
 * 使用 Puppeteer-Core + 本地浏览器渲染 Lottie 动画
 * @param {Object} lottieData - Lottie 动画数据
 * @param {number} width - 宽度
 * @param {number} height - 高度
 * @returns {Promise<Buffer>} PNG 图片的 Buffer
 */
async function renderMiddleFrame(lottieData, width, height) {
  initDebugLog();

  debugLog(`开始渲染 Lottie 缩略图 - Puppeteer-Core 方案`);
  debugLog(`平台: ${os.platform()}`);
  debugLog(`尺寸: ${width}x${height}`);
  debugLog(`Node 版本: ${process.version}`);
  debugLog(`工作目录: ${process.cwd()}`);
  debugLog("=".repeat(80));

  // 1. 查找浏览器路径
  const browserPath = findBrowser();
  if (!browserPath) {
    const errorMsg = "未找到本地 Chrome 或 Edge 浏览器，无法生成缩略图";
    debugError(errorMsg);
    finalizeDebugLog(false);
    throw new Error(errorMsg);
  }

  let browser = null;
  try {
    // 2. 启动浏览器 (Puppeteer Core)
    debugLog(`[Puppeteer] 启动浏览器: ${browserPath}`);
    browser = await puppeteer.launch({
      executablePath: browserPath,
      headless: "new", // 新版无头模式
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu", // Windows 必须禁用 GPU
        "--disable-dev-shm-usage",
        "--single-process",
      ],
    });

    debugLog("[Puppeteer] ✅ 浏览器已启动");

    const page = await browser.newPage();

    // 3. 设置视口大小
    await page.setViewport({ width, height });
    debugLog(`[Puppeteer] ✅ 视口已设置: ${width}x${height}`);

    // 4. 读取 lottie-web 库的内容
    let lottieScript;
    try {
      const lottieLibPath = require.resolve(
        "lottie-web/build/player/lottie.min.js"
      );
      lottieScript = fs.readFileSync(lottieLibPath, "utf8");
      debugLog("[Puppeteer] ✅ 从 node_modules 读取 lottie-web");
    } catch (e) {
      debugLog("[Puppeteer] ⚠️ 本地 lottie-web 未找到，将使用 CDN");
      lottieScript = null;
    }

    // 5. 构建 HTML 页面内容
    const htmlContent = lottieScript
      ? `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
                    #lottie { width: ${width}px; height: ${height}px; }
                </style>
                <script>${lottieScript}</script>
            </head>
            <body>
                <div id="lottie"></div>
                <script>
                    try {
                        const animationData = ${JSON.stringify(lottieData)};
                        const anim = lottie.loadAnimation({
                            container: document.getElementById('lottie'),
                            renderer: 'svg', // SVG 渲染更稳定
                            loop: false,
                            autoplay: false,
                            animationData: animationData
                        });

                        anim.addEventListener('DOMLoaded', () => {
                            // 跳转到中间帧
                            const totalFrames = anim.totalFrames;
                            anim.goToAndStop(Math.floor(totalFrames / 2), true);

                            // 标记渲染完成
                            window.lottieRendered = true;
                        });

                        anim.addEventListener('data_failed', (error) => {
                            window.lottieError = 'Lottie 数据加载失败';
                        });
                    } catch(e) {
                        window.lottieError = e.message;
                    }
                </script>
            </body>
            </html>
        `
      : `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { margin: 0; padding: 0; overflow: hidden; background: transparent; }
                    #lottie { width: ${width}px; height: ${height}px; }
                </style>
            </head>
            <body>
                <div id="lottie"></div>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.13.0/lottie.min.js"></script>
                <script>
                    try {
                        const animationData = ${JSON.stringify(lottieData)};
                        const anim = lottie.loadAnimation({
                            container: document.getElementById('lottie'),
                            renderer: 'svg',
                            loop: false,
                            autoplay: false,
                            animationData: animationData
                        });

                        anim.addEventListener('DOMLoaded', () => {
                            const totalFrames = anim.totalFrames;
                            anim.goToAndStop(Math.floor(totalFrames / 2), true);
                            window.lottieRendered = true;
                        });

                        anim.addEventListener('data_failed', (error) => {
                            window.lottieError = 'Lottie 数据加载失败';
                        });
                    } catch(e) {
                        window.lottieError = e.message;
                    }
                </script>
            </body>
            </html>
        `;

    // 6. 加载页面
    await page.setContent(htmlContent, {
      waitUntil: lottieScript ? "domcontentloaded" : "networkidle0",
    });
    debugLog("[Puppeteer] ✅ 页面内容已加载");

    // 7. 等待渲染完成 (轮询 window.lottieRendered)
    try {
      await page.waitForFunction("window.lottieRendered === true", {
        timeout: 10000,
      });
      debugLog("[Puppeteer] ✅ Lottie 动画已渲染");
    } catch (e) {
      // 检查是否有错误
      const error = await page.evaluate(() => window.lottieError);
      if (error) {
        throw new Error(`Lottie 渲染失败: ${error}`);
      }
      throw new Error("Lottie 渲染超时");
    }

    // 等待一小段时间确保渲染稳定
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 8. 截图并返回 Buffer
    const buffer = await page.screenshot({
      type: "png",
      omitBackground: true,
    });

    debugLog(`[Puppeteer] ✅ 截图成功，生成 ${buffer.length} 字节`);

    await browser.close();
    debugLog("[Puppeteer] 浏览器已关闭");

    finalizeDebugLog(true);
    return buffer;
  } catch (err) {
    if (browser) {
      await browser.close();
      debugLog("[Puppeteer] 浏览器已关闭");
    }
    debugError("❌ 渲染失败", err);
    finalizeDebugLog(false);
    throw err;
  }
}

module.exports = {
  renderMiddleFrame,
};
