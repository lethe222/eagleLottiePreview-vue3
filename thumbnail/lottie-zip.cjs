const path = require("path");
const fs = require("fs");
const zipUtil = require("../utils/zip-util.cjs");
const { renderMiddleFrame } = require("./renderer.cjs");

async function isLottieFile(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    const data = JSON.parse(content);
    return (
      data.layers !== undefined ||
      (data.v !== undefined && data.assets !== undefined)
    );
  } catch (error) {
    return false;
  }
}

function findImageInZip(fileName, baseDir, extractedFiles) {
  const candidates = [
    fileName,
    `${baseDir}/${fileName}`,
    `images/${fileName}`,
    fileName.replace(/^\.\//, ""),
    fileName.replace(/^\//, ""),
  ];

  for (const path of candidates) {
    if (extractedFiles[path]) {
      return extractedFiles[path];
    }
  }

  const baseName = fileName.split("/").pop();
  for (const [filePath, data] of Object.entries(extractedFiles)) {
    if (filePath.endsWith(baseName)) {
      return data;
    }
  }

  return null;
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

async function processLottieWithAssets(lottieData, extractedFiles, baseDir) {
  const processedData = JSON.parse(JSON.stringify(lottieData));

  if (processedData.assets) {
    for (let i = 0; i < processedData.assets.length; i++) {
      const asset = processedData.assets[i];

      if (
        asset.p &&
        typeof asset.p === "string" &&
        !asset.p.startsWith("data:")
      ) {
        let fileName = asset.p;
        if (asset.u) {
          fileName = path.join(asset.u, asset.p).replace(/\\/g, "/");
        }

        const fileData = findImageInZip(fileName, baseDir, extractedFiles);

        if (fileData) {
          const mimeType = getMimeType(fileName);
          const base64Data = Buffer.from(fileData).toString("base64");
          asset.p = `data:${mimeType};base64,${base64Data}`;
          asset.u = "";
          asset.e = 1;
          console.log(`✓ 转换图片资源: ${fileName}`);
        } else {
          console.log(`⚠ 未找到图片资源: ${fileName}`);
        }
      }
    }
  }

  return processedData;
}

module.exports = async ({ src, dest, item }) => {
  let tempDir = null;

  try {
    console.log("=== Lottie ZIP 缩略图生成器 ===");
    console.log("源文件:", src);
    console.log("目标文件:", dest);

    const { tempDir: extractedDir, files } = await zipUtil.extractZip(src);
    tempDir = extractedDir;
    console.log("✓ ZIP 文件解压完成，文件数量:", Object.keys(files).length);

    const lottieJsonPath = await zipUtil.findLottieJsonFile(tempDir, files);
    console.log("✓ 找到 Lottie JSON 文件:", lottieJsonPath);

    if (!(await isLottieFile(lottieJsonPath))) {
      throw new Error("ZIP 中的 JSON 文件不是有效的 Lottie 文件");
    }

    const lottieData = JSON.parse(
      await fs.promises.readFile(lottieJsonPath, "utf8"),
    );

    const originalWidth = lottieData.w || lottieData.width || 512;
    const originalHeight = lottieData.h || lottieData.height || 512;
    const frameRate = lottieData.fr || 30;
    const inPoint = lottieData.ip || 0;
    const outPoint = lottieData.op || 0;
    const duration = (outPoint - inPoint) / frameRate;
    const filename = path.basename(src, ".zip");

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
      name: filename,
      totalFrames: outPoint - inPoint,
      isZip: true,
      thumbnailScale: scaleFactor,
      thumbnailWidth,
      thumbnailHeight,
    };

    console.log(
      `Lottie 信息: ${originalWidth}x${originalHeight}, ${duration.toFixed(1)}s, ${frameRate}fps, ${metadata.totalFrames}帧`,
    );

    const baseDir = path
      .dirname(lottieJsonPath)
      .replace(tempDir, "")
      .replace(/^\//, "");
    const processedLottieData = await processLottieWithAssets(
      lottieData,
      files,
      baseDir,
    );

    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const pngBuffer = await renderMiddleFrame(
      processedLottieData,
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
      isZip: true,
    };

    return item;
  } catch (err) {
    console.error("❌ ZIP Lottie 处理错误:", err);
    throw err;
  } finally {
    if (tempDir) {
      try {
        await zipUtil.cleanupTempDir(tempDir);
      } catch (cleanupError) {
        console.error("清理临时目录失败:", cleanupError.message);
      }
    }
  }
};
