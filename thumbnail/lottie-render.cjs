const path = require("path");
const fs = require("fs");
const { renderMiddleFrame, TIMEOUTS } = require("./renderer.cjs");

module.exports = async ({ src, dest, item }) => {
  try {
    console.log("=== Lottie JSON 缩略图生成器 ===");
    console.log("源文件:", src);
    console.log("目标文件:", dest);

    // 一次性读取并解析文件
    const content = await fs.promises.readFile(src, "utf8");
    const lottieData = JSON.parse(content);

    // 验证是否为有效的 Lottie 文件
    if (!lottieData.layers && !(lottieData.v && lottieData.assets)) {
      throw new Error("不是有效的 Lottie 文件");
    }
    console.log("✓ Lottie 文件验证通过");

    const originalWidth = lottieData.w || lottieData.width || 512;
    const originalHeight = lottieData.h || lottieData.height || 512;
    const frameRate = lottieData.fr || 30;
    const inPoint = lottieData.ip || 0;
    const outPoint = lottieData.op || 0;
    const duration = (outPoint - inPoint) / frameRate;
    const name = lottieData.nm || path.basename(src, ".json");

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
      `Lottie 信息: ${originalWidth}x${originalHeight}, ${duration.toFixed(1)}s, ${frameRate}fps, ${metadata.totalFrames}帧`,
    );

    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const pngBuffer = await renderMiddleFrame(
      lottieData,
      thumbnailWidth,
      thumbnailHeight,
    );

    console.log(`PNG 数据大小: ${pngBuffer.length} bytes`);

    await fs.promises.writeFile(dest, pngBuffer);
    console.log("✓ PNG 文件已创建");

    const stats = fs.statSync(dest);
    if (stats.size === 0) {
      throw new Error("缩略图文件大小为 0");
    }

    console.log(`✓ 文件验证成功，大小: ${stats.size} bytes`);

    item.height = originalHeight;
    item.width = originalWidth;
    item.lottie = {
      ...metadata,
      duration: `${Math.round(duration * 100) / 100}秒`,
      frameRate: `${frameRate}fps`,
      thumbnailType: "middle_frame",
      isZip: false,
    };

    return item;
  } catch (err) {
    console.error("❌ Lottie 处理错误:", err);
    throw err;
  }
};
