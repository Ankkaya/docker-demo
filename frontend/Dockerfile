FROM node:20-alpine AS build           # 使用 Node 20 Alpine 作为前端构建阶段镜像
WORKDIR /app                           # 设置工作目录为 /app，后续命令都在此目录执行
RUN corepack enable                    # 启用 corepack，使 pnpm 等包管理工具可用
COPY package.json pnpm-lock.yaml ./    # 只复制依赖清单和锁文件，便于 Docker 利用缓存
RUN pnpm install --frozen-lockfile     # 根据锁文件安装依赖，保证依赖版本一致
COPY . .                               # 复制当前项目所有源码到容器的 /app 目录
RUN pnpm build                         # 执行前端构建命令，生成 dist 静态资源

FROM node:20-alpine AS runner          # 使用轻量 Node 20 Alpine 作为运行阶段镜像
WORKDIR /app                           # 运行阶段同样使用 /app 作为工作目录
COPY --from=build /app/dist ./dist     # 从构建阶段复制打包好的 dist 到运行镜像中
RUN npm install -g http-server         # 全局安装 http-server 用于提供静态文件服务
EXPOSE 8080                            # 声明容器对外暴露的端口为 8080
CMD ["http-server", "-p", "8080", "dist"]  # 使用 http-server 在 8080 端口托管 dist 目录