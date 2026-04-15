# 部署

对于 uni-app 来说，部署即打包和发行。

## Web

使用下面的命令来打包：

```bash
pnpm build:h5
```

产物位于 `dist/build/h5`, 就像传统 SPA 一样部署即可。

## 小程序

以微信小程序为例，本地开发模式现在支持显式切换 `development`、`staging` 两套环境变量：

```bash
pnpm dev:mp-weixin:development
pnpm dev:mp-weixin:staging
```

如果只需要默认模式，也可以继续使用：

```bash
pnpm dev:mp-weixin
```

打包命令如下：

```bash
pnpm build:mp-weixin
pnpm build:mp-weixin:development
pnpm build:mp-weixin:staging
```

产物位于 `dist/build/mp-weixin`, 使用微信开发者工具上传即可。

::: tip
如果想自动上传到微信小程序，可直接使用 [uni-mini-ci](https://www.npmjs.com/package/uni-mini-ci)，或参考 [这篇文章](https://juejin.cn/post/7272316909051346959) 自行配置。
:::

本项目已经补充了基于 `miniprogram-ci` 的自动上传脚本，支持 `staging`、`production` 两个环境在构建完成后直接上传测试版：

```bash
pnpm build:mp-weixin:staging
pnpm build:mp-weixin:production
```

首次使用前，需要在 `mobile` 目录准备上传配置：

```bash
WECHAT_MINIPROGRAM_APPID=wx7fa24fca081acf97
WECHAT_UPLOAD_PRIVATE_KEY_PATH=./keys/private.wx7fa24fca081acf97.key
WECHAT_UPLOAD_ROBOT_STAGING=1
WECHAT_UPLOAD_ROBOT_PRODUCTION=2
WECHAT_UPLOAD_DESC_STAGING=staging 测试版
WECHAT_UPLOAD_DESC_PRODUCTION=production 测试版
```

建议将这些变量放到 `.env.local` 或 `.env.staging.local` / `.env.production.local` 中，私钥文件放到 `mobile/keys/` 目录下，该目录已加入 `.gitignore`。

如果只想检查解析到的上传参数，不实际上传，可执行：

```bash
pnpm upload:mp-weixin:staging:dry-run
pnpm upload:mp-weixin:production:dry-run
```

要发行其他小程序，执行 `pnpm build:mp-<platform>`打包，并使用对应开发者工具上传即可，具体可查看 `package.json` 的 `scripts` 部分。

## APP

### 离线打包

- [android](https://nativesupport.dcloud.net.cn/AppDocs/usesdk/android.html)
- [ios](https://nativesupport.dcloud.net.cn/AppDocs/usesdk/ios.html)

::: warning
你仍然可以使用 HBuilderX 提供的“安心”打包功能，但是由于这种方式强依赖 HBuilderX，故不做推荐。
:::
