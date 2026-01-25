const path = require("path");
const fs = require("fs");
const { JSDOM } = require("jsdom");
const { createCanvas, loadImage } = require("canvas");

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
 * 使用 JSDOM + lottie-web 渲染 Lottie 帧
 */
async function renderLottieFrame(lottieData, width, height, frameNumber = 0) {
  try {
    console.log("开始使用 JSDOM 渲染 Lottie...");

    // 创建 JSDOM 环境
    const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div id="lottie-container" style="width:${width}px;height:${height}px;"></div>
                </body>
            </html>
        `);

    const { window } = dom;
    const { document } = window;

    // 设置全局对象，lottie-web 需要这些
    global.window = window;
    global.document = document;
    global.navigator = window.navigator;
    global.HTMLImageElement = window.HTMLImageElement;
    global.XMLHttpRequest = window.XMLHttpRequest;

    // 加载 lottie-web
    const lottie = require("lottie-web");

    // 渲染 Lottie
    const container = document.getElementById("lottie-container");
    const animation = lottie.loadAnimation({
      container: container,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: lottieData,
    });

    // 等待加载完成
    await new Promise((resolve) => {
      animation.addEventListener("DOMLoaded", resolve);
    });

    console.log(`Lottie 加载完成，总帧数: ${animation.totalFrames}`);

    // 跳转到指定帧（默认中间帧）
    const targetFrame = frameNumber || Math.floor(animation.totalFrames / 2);
    animation.goToAndStop(targetFrame, true);

    console.log(`跳转到第 ${targetFrame} 帧`);

    // 获取 SVG 元素
    const svgElement = container.querySelector("svg");
    if (!svgElement) {
      throw new Error("无法找到 SVG 元素");
    }

    // 序列化 SVG
    const svgString = svgElement.outerHTML;

    // 清理全局对象
    delete global.window;
    delete global.document;
    delete global.navigator;
    delete global.HTMLImageElement;
    delete global.XMLHttpRequest;

    console.log("SVG 生成成功，准备转换为 PNG");

    // 将 SVG 转换为 PNG
    return await svgToPng(svgString, width, height);
  } catch (error) {
    console.error("JSDOM 渲染失败:", error);
    throw error;
  }
}

/**
 * 将 SVG 字符串转换为 PNG Buffer
 */
async function svgToPng(svgString, width, height) {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 设置透明背景
    ctx.clearRect(0, 0, width, height);

    // 将 SVG 转换为 data URL
    const svgBuffer = Buffer.from(svgString);
    const svgDataUrl = `data:image/svg+xml;base64,${svgBuffer.toString("base64")}`;

    // 加载并绘制 SVG
    const img = await loadImage(svgDataUrl);
    ctx.drawImage(img, 0, 0, width, height);

    console.log("PNG 转换成功");

    return canvas.toBuffer("image/png");
  } catch (error) {
    console.error("SVG 转 PNG 失败:", error);
    throw error;
  }
}

/**
 * 生成简单的播放按钮 PNG（备用方案）
 */
async function generateSimplePlayButton(width, height) {
  try {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 透明背景
    ctx.clearRect(0, 0, width, height);

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
    console.error("生成播放按钮失败:", error);
    throw error;
  }
}

/**
 * 生成最小 PNG（最后备用）
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
      console.log("=== JSDOM Lottie 渲染器 ===");
      console.log("源文件:", src);
      console.log("目标文件:", dest);

      // 验证是否为 Lottie 文件
      if (!(await isLottieFile(src))) {
        return reject(new Error("不是有效的Lottie文件"));
      }
      console.log("✓ Lottie文件验证通过");

      // 读取 Lottie 数据
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
      if (scaleFactor > 1) {
        console.log(
          `缩略图尺寸: ${thumbnailWidth}x${thumbnailHeight} (${scaleFactor}x 放大)`,
        );
      }

      // 确保目标目录存在
      const dir = path.dirname(dest);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let pngBuffer;

      try {
        // 尝试使用 JSDOM 渲染实际帧
        console.log("尝试使用 JSDOM 渲染实际帧...");
        pngBuffer = await renderLottieFrame(
          lottieData,
          thumbnailWidth,
          thumbnailHeight,
        );
        console.log("✓ JSDOM 渲染成功");
      } catch (jsdomError) {
        console.log(
          "JSDOM 渲染失败，使用备用方案（播放按钮）:",
          jsdomError.message,
        );

        try {
          // 备用方案：生成播放按钮
          pngBuffer = await generateSimplePlayButton(
            thumbnailWidth,
            thumbnailHeight,
          );
          console.log("✓ 播放按钮生成成功");
        } catch (buttonError) {
          console.log("播放按钮生成失败，使用最小 PNG:", buttonError.message);
          pngBuffer = generateMinimalPNG();
        }
      }

      console.log(`PNG数据大小: ${pngBuffer.length} bytes`);

      // 写入文件
      await fs.promises.writeFile(dest, pngBuffer);
      console.log("✓ PNG文件已创建");

      // 验证文件
      const stats = fs.statSync(dest);
      if (stats.size === 0) {
        return reject(new Error("缩略图文件大小为0"));
      }

      console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);

      // 设置元数据
      item.height = originalHeight;
      item.width = originalWidth;
      item.lottie = {
        ...metadata,
        duration: `${Math.round(duration * 100) / 100}秒`,
        frameRate: `${frameRate}fps`,
        thumbnailType: "jsdom_svg",
        isZip: false,
      };

      return resolve(item);
    } catch (err) {
      console.error("❌ Lottie 处理错误:", err);
      return reject(err);
    }
  });
};
