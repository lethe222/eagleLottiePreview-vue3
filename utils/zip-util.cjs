const fs = require("fs");
const path = require("path");
const os = require("os");

const MAX_ZIP_SIZE = 20 * 1024 * 1024;
const EXTRACT_TIMEOUT = 30000;

function withTimeout(promise, ms, errorMsg = "操作超时") {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(errorMsg)), ms),
    ),
  ]);
}

async function extractZip(zipPath) {
  console.log("开始解压文件:", zipPath);

  const stats = fs.statSync(zipPath);
  if (stats.size > MAX_ZIP_SIZE) {
    throw new Error(
      `ZIP 文件过大 (${(stats.size / 1024 / 1024).toFixed(2)}MB)，最大支持 20MB`,
    );
  }
  console.log(`文件大小: ${(stats.size / 1024 / 1024).toFixed(2)}MB`);

  const tempDir = path.join(os.tmpdir(), `lottie_zip_${Date.now()}`);
  await fs.promises.mkdir(tempDir, { recursive: true });

  const files = {};

  try {
    const fileBuffer = await fs.promises.readFile(zipPath);

    const isZip =
      fileBuffer.length > 4 &&
      fileBuffer[0] === 0x50 &&
      fileBuffer[1] === 0x4b &&
      fileBuffer[2] === 0x03 &&
      fileBuffer[3] === 0x04;

    if (!isZip) {
      console.log("不是 ZIP 文件，尝试作为 JSON 文件处理");
      const destPath = path.join(tempDir, path.basename(zipPath));
      await fs.promises.copyFile(zipPath, destPath);
      files[path.basename(zipPath)] = fileBuffer;
      return { tempDir, files };
    }

    console.log("检测到 ZIP 文件，开始解压");

    const extractPromise = new Promise((resolve, reject) => {
      try {
        const AdmZip = require("adm-zip");
        const zip = new AdmZip(zipPath);
        const zipEntries = zip.getEntries();

        console.log(`找到 ${zipEntries.length} 个文件`);

        zip.extractAllTo(tempDir, true);

        for (const entry of zipEntries) {
          if (!entry.isDirectory) {
            files[entry.entryName] = entry.getData();
            console.log("解压文件:", entry.entryName);
          }
        }

        resolve({ tempDir, files });
      } catch (err) {
        reject(new Error(`解压 ZIP 文件失败: ${err.message}`));
      }
    });

    return await withTimeout(
      extractPromise,
      EXTRACT_TIMEOUT,
      `ZIP 解压超时（${EXTRACT_TIMEOUT / 1000}秒）`,
    );
  } catch (error) {
    await cleanupTempDir(tempDir);
    throw error;
  }
}

async function findLottieJsonFile(dirPath, files) {
  try {
    const fileEntries = Object.entries(files);

    const jsonFiles = fileEntries.filter(
      ([name]) =>
        name.toLowerCase().endsWith(".json") ||
        path.basename(name).toLowerCase() === "data" ||
        path.basename(name).toLowerCase() === "animation",
    );

    for (const [name, buffer] of jsonFiles) {
      try {
        const content = buffer.toString("utf8");
        const data = JSON.parse(content);

        if (
          data.layers !== undefined ||
          (data.v !== undefined && data.assets !== undefined)
        ) {
          return path.join(dirPath, name);
        }
      } catch (e) {
        continue;
      }
    }

    for (const [name, buffer] of fileEntries) {
      try {
        const content = buffer.toString("utf8");
        if (
          content.includes('"layers"') &&
          (content.includes('"v"') || content.includes('"fr"'))
        ) {
          return path.join(dirPath, name);
        }
      } catch (e) {
        continue;
      }
    }

    throw new Error("未在 ZIP 文件中找到 Lottie JSON 文件");
  } catch (error) {
    throw error;
  }
}

async function findAllImages(dirPath, files) {
  const images = [];
  const imgExtensions = [".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp"];

  for (const [name, buffer] of Object.entries(files)) {
    const ext = path.extname(name).toLowerCase();
    if (imgExtensions.includes(ext)) {
      images.push({
        name,
        path: path.join(dirPath, name),
        buffer,
      });
    }
  }

  return images;
}

async function cleanupTempDir(tempDir) {
  try {
    if (tempDir && fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
      console.log("✓ 临时目录已清理:", tempDir);
    }
  } catch (error) {
    console.error(`清理临时目录失败: ${error.message}`);
  }
}

module.exports = {
  extractZip,
  findLottieJsonFile,
  findAllImages,
  cleanupTempDir,
  MAX_ZIP_SIZE,
  EXTRACT_TIMEOUT,
};
