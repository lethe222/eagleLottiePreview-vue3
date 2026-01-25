const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

/**
 * 检查是否为Lottie文件
 */
async function isLottieFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    const data = JSON.parse(content);
    return data.v && (data.layers || data.assets);
  } catch (error) {
    return false;
  }
}

/**
 * 使用 Puppeteer 渲染 Lottie 动画的某一帧
 */
async function renderLottieFrameWithPuppeteer(lottieData, width, height) {
  let browser = null;
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width, height });

    // 创建 HTML 页面来渲染 Lottie
    const html = `
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
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
  <script>
    const animationData = ${JSON.stringify(lottieData)};
    const animation = lottie.loadAnimation({
      container: document.getElementById('lottie'),
      renderer: 'svg',
      loop: false,
      autoplay: false,
      animationData: animationData
    });

    // 跳转到中间帧
    const middleFrame = Math.floor(animation.totalFrames / 2);
    animation.goToAndStop(middleFrame, true);

    window.lottieReady = true;
  </script>
</body>
</html>`;

    await page.setContent(html);

    // 等待 Lottie 加载完成
    await page.waitForFunction(() => window.lottieReady === true, { timeout: 5000 });
    await new Promise(resolve => setTimeout(resolve, 500)); // 额外等待渲染完成

    // 截图
    const screenshot = await page.screenshot({
      type: 'png',
      omitBackground: true,
    });

    await browser.close();
    return screenshot;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

/**
 * 生成带播放按钮的缩略图（fallback）
 */
async function generateFallbackThumbnail(width, height) {
  try {
    const { createCanvas } = require("canvas");
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 透明背景
    ctx.clearRect(0, 0, width, height);

    // 绘制播放按钮
    const centerX = width / 2;
    const centerY = height / 2;
    const buttonSize = Math.min(width, height) * 0.25;

    // 绘制半透明白色圆圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, buttonSize, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 绘制播放三角形
    const triangleSize = buttonSize * 0.6;
    ctx.beginPath();
    ctx.moveTo(centerX - triangleSize / 2, centerY - triangleSize / 2);
    ctx.lineTo(centerX - triangleSize / 2, centerY + triangleSize / 2);
    ctx.lineTo(centerX + triangleSize / 2, centerY);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();

    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("Fallback 缩略图生成失败:", error.message);
    return generateMinimalPNG();
  }
}

/**
 * 生成最小 PNG
 */
function generateMinimalPNG() {
  return Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00,
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
    0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xff, 0xff, 0x3f,
    0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00,
    0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ]);
}

/**
 * 主处理函数
 */
module.exports = async ({ src, dest, item }) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("=== Lottie Puppeteer 渲染处理器 ===");
      console.log("源文件:", src);
      console.log("目标文件:", dest);

      if (!(await isLottieFile(src))) {
        return reject(new Error("不是有效的Lottie文件"));
      }
      console.log("✓ Lottie文件验证通过");

      const lottieData = JSON.parse(await fs.promises.readFile(src, "utf8"));

      const originalWidth = lottieData.w || lottieData.width || 512;
      const originalHeight = lottieData.h || lottieData.height || 512;
      const frameRate = lottieData.fr || 30;
      const inPoint = lottieData.ip || 0;
      const outPoint = lottieData.op || 0;
      const duration = (outPoint - inPoint) / frameRate;
      const name = lottieData.nm || path.basename(src, ".json");

      // 判断是否需要放大缩略图尺寸
      let thumbnailWidth = originalWidth;
      let thumbnailHeight = originalHeight;
      let scaleFactor = 1;

      if (originalWidth < 250 && originalHeight < 250) {
        scaleFactor = 2;
        thumbnailWidth = originalWidth * scaleFactor;
        thumbnailHeight = originalHeight * scaleFactor;
        console.log(
          `小尺寸文件检测: ${originalWidth}x${originalHeight} -> 缩略图尺寸放大为 ${thumbnailWidth}x${thumbnailHeight} (${scaleFactor}x)`,
        );
      }

      const metadata = {
        width: originalWidth,
        height: originalHeight,
        frameRate,
        duration,
        name,
        totalFrames: outPoint - inPoint,
        isZip: false,
        thumbnailScale: scaleFactor,
        thumbnailWidth,
        thumbnailHeight,
      };

      console.log(
        `Lottie信息: ${originalWidth}x${originalHeight}, ${duration.toFixed(1)}s, ${frameRate}fps, ${metadata.totalFrames}帧`,
      );

      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let pngBuffer;
      try {
        console.log("尝试使用 Puppeteer 渲染 Lottie 动画帧...");
        pngBuffer = await renderLottieFrameWithPuppeteer(
          lottieData,
          thumbnailWidth,
          thumbnailHeight,
        );
        console.log("✓ Puppeteer 渲染成功");
      } catch (error) {
        console.log("Puppeteer 渲染失败，使用 fallback:", error.message);
        pngBuffer = await generateFallbackThumbnail(
          thumbnailWidth,
          thumbnailHeight,
        );
      }

      console.log(`PNG数据大小: ${pngBuffer.length} bytes`);

      await fs.promises.writeFile(dest, pngBuffer);
      console.log("✓ PNG文件已创建");

      const stats = fs.statSync(dest);
      if (stats.size === 0) {
        return reject(new Error("缩略图文件大小为0"));
      }

      console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);

      item.height = originalHeight;
      item.width = originalWidth;
      item.lottie = {
        ...metadata,
        duration: `${Math.round(duration * 100) / 100}秒`,
        frameRate: `${frameRate}fps`,
        thumbnailType: "lottie_puppeteer_render",
        isZip: false,
      };

      return resolve(item);
    } catch (err) {
      console.error("❌ Lottie 处理错误:", err);
      return reject(err);
    }
  });
};
