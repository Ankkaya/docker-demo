#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const mobileRoot = path.resolve(__dirname, '..')
const supportedModes = new Set(['staging', 'production'])

function loadEnv(mode) {
  const envFiles = [
    '.env',
    `.env.${mode}`,
    '.env.local',
    `.env.${mode}.local`,
  ]

  for (const file of envFiles) {
    const fullPath = path.join(mobileRoot, file)

    if (fs.existsSync(fullPath)) {
      dotenv.config({
        path: fullPath,
        override: true,
      })
    }
  }
}

function resolveLocalPath(value) {
  if (!value) {
    return value
  }

  return path.isAbsolute(value) ? value : path.resolve(mobileRoot, value)
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function getManifestAppId() {
  const manifestPath = path.join(mobileRoot, 'src/manifest.json')

  if (!fs.existsSync(manifestPath)) {
    return ''
  }

  const manifest = readJson(manifestPath)
  return manifest?.['mp-weixin']?.appid ?? ''
}

function getPackageVersion() {
  const packageJsonPath = path.join(mobileRoot, 'package.json')
  const packageJson = readJson(packageJsonPath)
  return packageJson.version ?? '1.0.0'
}

function getArg(name) {
  const prefix = `${name}=`
  return process.argv.slice(2).find(arg => arg.startsWith(prefix))?.slice(prefix.length)
}

function formatProgress(progress) {
  if (typeof progress === 'string') {
    return progress
  }

  if (progress && typeof progress === 'object') {
    return JSON.stringify(progress)
  }

  return String(progress)
}

async function main() {
  const mode = process.argv[2]
  const isDryRun = process.argv.includes('--dry-run')

  if (!supportedModes.has(mode)) {
    throw new Error('请传入 staging 或 production，例如: node scripts/upload-weixin-ci.mjs staging')
  }

  loadEnv(mode)

  const appid = process.env.WECHAT_MINIPROGRAM_APPID || getManifestAppId()
  const privateKey = process.env.WECHAT_UPLOAD_PRIVATE_KEY
  const privateKeyPath = resolveLocalPath(process.env.WECHAT_UPLOAD_PRIVATE_KEY_PATH)
  const projectPath = resolveLocalPath(process.env.WECHAT_UPLOAD_PROJECT_PATH || 'dist/build/mp-weixin')
  const robot = Number(
    process.env[`WECHAT_UPLOAD_ROBOT_${mode.toUpperCase()}`]
    || process.env.WECHAT_UPLOAD_ROBOT
    || '1',
  )
  const version = process.env.WECHAT_UPLOAD_VERSION || getPackageVersion()
  const desc = getArg('--desc')
    || process.env[`WECHAT_UPLOAD_DESC_${mode.toUpperCase()}`]
    || process.env.WECHAT_UPLOAD_DESC
    || `${mode} 测试版 ${version}`

  if (!appid) {
    throw new Error('未找到微信小程序 appid，请配置 WECHAT_MINIPROGRAM_APPID 或在 src/manifest.json 中声明 mp-weixin.appid')
  }

  if (!privateKey && !privateKeyPath) {
    throw new Error('未找到上传密钥，请配置 WECHAT_UPLOAD_PRIVATE_KEY 或 WECHAT_UPLOAD_PRIVATE_KEY_PATH')
  }

  if (privateKeyPath && !fs.existsSync(privateKeyPath)) {
    throw new Error(`上传密钥文件不存在: ${privateKeyPath}`)
  }

  if (!fs.existsSync(projectPath)) {
    throw new Error(`小程序构建产物不存在: ${projectPath}`)
  }

  const projectConfigPath = path.join(projectPath, 'project.config.json')

  if (!fs.existsSync(projectConfigPath)) {
    throw new Error(`未找到 project.config.json: ${projectConfigPath}`)
  }

  const resolvedConfig = {
    mode,
    appid,
    projectPath,
    robot,
    version,
    desc,
    privateKeyPath: privateKeyPath || '[env:WECHAT_UPLOAD_PRIVATE_KEY]',
  }

  if (isDryRun) {
    console.log('[dry-run] 当前上传配置:')
    console.log(JSON.stringify(resolvedConfig, null, 2))
    return
  }

  console.log('[upload] 开始上传微信小程序测试版')
  console.log(JSON.stringify(resolvedConfig, null, 2))

  const { default: ci } = await import('miniprogram-ci')

  const project = new ci.Project({
    appid,
    type: 'miniProgram',
    projectPath,
    ...(privateKey ? { privateKey } : { privateKeyPath }),
    ignores: ['node_modules/**/*'],
  })

  const result = await ci.upload({
    project,
    version,
    desc,
    robot,
    setting: {
      useProjectConfig: true,
    },
    onProgressUpdate(progress) {
      console.log(`[upload-progress] ${formatProgress(progress)}`)
    },
  })

  console.log('[upload] 上传完成')
  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((error) => {
    console.error('[upload] 上传失败')
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit()
  })
