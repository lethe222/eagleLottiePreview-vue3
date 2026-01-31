const path = require('path');
const fs = require('fs');

async function testThumbnailGeneration() {
  console.log('=== Eagle Lottie 缩略图生成测试 ===\n');

  const testCases = [
    {
      name: '测试 JSON 文件',
      type: 'json',
      file: process.argv[2],
      handler: './thumbnail/lottie-render.cjs',
    },
    {
      name: '测试 ZIP 文件',
      type: 'zip',
      file: process.argv[3],
      handler: './thumbnail/lottie-zip.cjs',
    },
  ];

  for (const tc of testCases) {
    if (!tc.file) {
      console.log(`⏭️  跳过 ${tc.name}: 未提供测试文件\n`);
      continue;
    }

    if (!fs.existsSync(tc.file)) {
      console.log(`❌ ${tc.name} 失败: 文件不存在 ${tc.file}\n`);
      continue;
    }

    console.log(`🧪 ${tc.name}: ${tc.file}`);

    try {
      const handler = require(tc.handler);
      const dest = path.join(__dirname, `test-output-${tc.type}.png`);

      const item = {};
      const startTime = Date.now();

      await handler({
        src: tc.file,
        dest: dest,
        item: item,
      });

      const elapsed = Date.now() - startTime;

      if (fs.existsSync(dest)) {
        const stats = fs.statSync(dest);
        console.log(`✅ ${tc.name} 成功`);
        console.log(`   耗时: ${elapsed}ms`);
        console.log(`   输出: ${dest}`);
        console.log(`   大小: ${stats.size} bytes`);
        console.log(`   元数据:`, JSON.stringify(item.lottie, null, 2));
      } else {
        console.log(`❌ ${tc.name} 失败: 输出文件未生成`);
      }
    } catch (error) {
      console.log(`❌ ${tc.name} 失败:`, error.message);
      console.log(`   堆栈:`, error.stack);
    }

    console.log('');
  }

  console.log('测试完成！\n');
  console.log('使用方法:');
  console.log('  node test-thumbnail.js <json文件路径> [zip文件路径]');
  console.log('');
  console.log('示例:');
  console.log('  node test-thumbnail.js ./test.json');
  console.log('  node test-thumbnail.js ./test.json ./test.zip');
}

if (require.main === module) {
  if (process.argv.length < 3) {
    console.log('用法: node test-thumbnail.js <json文件路径> [zip文件路径]');
    console.log('');
    console.log('示例:');
    console.log('  node test-thumbnail.js ./test.json');
    console.log('  node test-thumbnail.js ./test.json ./test.zip');
    process.exit(1);
  }

  testThumbnailGeneration().catch(console.error);
}

module.exports = { testThumbnailGeneration };
