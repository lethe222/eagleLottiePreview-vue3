<template>
  <LottiePlayer
    :animation-data="animationData"
    :title="title"
    :is-zip="true"
    loading-text="正在解压并加载动画..."
    @loaded="onLoaded"
    @error="onError"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LottiePlayer from '../components/LottiePlayer.vue'
import JSZip from 'jszip'

const animationData = ref(null)
const title = ref('加载中...')

const onLoaded = (info) => {
  console.log('动画加载完成:', info)
}

const onError = (error) => {
  console.error('动画加载失败:', error)
}

// 获取文件的 MIME 类型
const getMimeType = (filename) => {
  const ext = filename.split('.').pop().toLowerCase()
  const mimeTypes = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    webp: 'image/webp'
  }
  return mimeTypes[ext] || 'image/png'
}

// 将文件转换为 Base64
const fileToBase64 = async (uint8Array, mimeType) => {
  return new Promise((resolve) => {
    const blob = new Blob([uint8Array], { type: mimeType })
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

// 查找 Lottie JSON 文件
const findLottieJsonFile = (files) => {
  const jsonFiles = Object.keys(files).filter(filename =>
    filename.toLowerCase().endsWith('.json')
  )

  if (jsonFiles.length === 0) {
    return null
  }

  // 优先查找根目录的 JSON 文件
  const rootJsonFiles = jsonFiles.filter(filename => !filename.includes('/'))
  if (rootJsonFiles.length > 0) {
    // 优先查找可能的 Lottie 文件名
    const possibleNames = ['data.json', 'animation.json', 'lottie.json', 'main.json']
    for (const name of possibleNames) {
      const found = rootJsonFiles.find(filename =>
        filename.toLowerCase() === name.toLowerCase()
      )
      if (found) return found
    }
    return rootJsonFiles[0]
  }

  return jsonFiles[0]
}

// 处理 Lottie 动画中的外部资源
const processLottieWithAssets = async (jsonData, files) => {
  try {
    if (!jsonData.assets || !Array.isArray(jsonData.assets)) {
      return jsonData
    }

    console.log('开始处理资源，assets 数量:', jsonData.assets.length)

    // 查找所有图片文件
    const imageFiles = Object.keys(files).filter(filename => {
      const ext = filename.split('.').pop().toLowerCase()
      return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)
    })

    console.log('找到图片文件:', imageFiles)

    // 处理所有资源
    for (let i = 0; i < jsonData.assets.length; i++) {
      const asset = jsonData.assets[i]

      // 跳过已经内嵌的资源或者不是图片资源
      if (asset.e === 1 || !asset.p) continue

      console.log('处理资源:', asset)

      // 查找匹配的图片文件
      let matchedFile = null
      const assetPath = asset.p

      // 构建可能的完整路径
      let possiblePaths = [assetPath]

      // 如果有 u 属性（通常是 "images/"），组合路径
      if (asset.u) {
        possiblePaths.push(asset.u + assetPath)
        possiblePaths.push(asset.u.replace(/\/$/, '') + '/' + assetPath)
      }

      // 添加 images/ 前缀的可能性
      possiblePaths.push('images/' + assetPath)
      possiblePaths.push('./images/' + assetPath)

      // 只使用文件名匹配
      const assetFileName = assetPath.split('/').pop()
      possiblePaths.push(assetFileName)

      console.log('尝试匹配路径:', possiblePaths)

      // 尝试各种可能的路径
      for (const possiblePath of possiblePaths) {
        matchedFile = imageFiles.find(filename => {
          return (
            filename === possiblePath ||
            filename.endsWith('/' + possiblePath) ||
            filename.split('/').pop() === possiblePath
          )
        })
        if (matchedFile) {
          console.log('找到匹配文件:', possiblePath, '->', matchedFile)
          break
        }
      }

      if (matchedFile && files[matchedFile]) {
        try {
          const mimeType = getMimeType(matchedFile)
          const base64 = await fileToBase64(files[matchedFile], mimeType)

          // 将图片转换为内嵌资源
          asset.e = 1 // 标记为内嵌
          asset.p = base64 // 替换路径为 Base64 数据
          if (asset.u) asset.u = '' // 清除 u 路径

          console.log(`✅ 成功处理资源: ${assetPath} -> ${matchedFile}`)
        } catch (error) {
          console.error(`❌ 处理资源时出错: ${assetPath}`, error)
        }
      } else {
        console.warn(`⚠️ 未找到匹配的图片资源: ${assetPath}`)
        console.log('可用的图片文件:', imageFiles)
      }
    }

    return jsonData
  } catch (error) {
    console.error('处理外部资源时出错:', error)
    return jsonData
  }
}

// 从 URL 加载并解压 ZIP 文件
const loadZipFromUrl = async (url) => {
  try {
    console.log('开始加载 ZIP 文件:', url)

    // 获取文件
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`无法加载文件: ${response.status} ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    console.log('文件下载完成，大小:', arrayBuffer.byteLength)

    // 使用 JSZip 解压
    const zip = new JSZip()
    const zipContent = await zip.loadAsync(arrayBuffer)

    // 提取所有文件
    const files = {}
    const promises = []

    zipContent.forEach((relativePath, zipEntry) => {
      if (!zipEntry.dir) {
        promises.push(
          zipEntry.async('uint8array').then(content => {
            files[relativePath] = content
          })
        )
      }
    })

    await Promise.all(promises)
    console.log('解压完成，文件列表:', Object.keys(files))

    // 查找 Lottie JSON 文件
    const jsonFilename = findLottieJsonFile(files)
    if (!jsonFilename) {
      throw new Error('ZIP 文件中未找到 JSON 文件')
    }

    console.log('找到 Lottie JSON 文件:', jsonFilename)

    // 读取 JSON 内容
    const jsonContent = new TextDecoder().decode(files[jsonFilename])
    let lottieData = JSON.parse(jsonContent)

    console.log('JSON 文件读取成功，开始处理资源')

    // 处理外部资源，将图片转换为 base64
    lottieData = await processLottieWithAssets(lottieData, files)

    console.log('资源处理完成，开始创建动画')

    // 更新标题
    const filename = url.split('/').pop().replace('.zip', '')
    title.value = filename

    // 设置动画数据
    animationData.value = lottieData
  } catch (error) {
    console.error('加载 ZIP 文件时出错:', error)
    onError(error)
  }
}

onMounted(() => {
  // 获取 URL 参数
  const urlParams = new URLSearchParams(window.location.search)
  const zipPath = urlParams.get('path')

  if (zipPath) {
    loadZipFromUrl(zipPath)
  } else {
    onError(new Error('未提供 ZIP 文件路径'))
  }
})
</script>

<style scoped>
/* 全局样式已在 LottiePlayer 组件中定义 */
</style>
