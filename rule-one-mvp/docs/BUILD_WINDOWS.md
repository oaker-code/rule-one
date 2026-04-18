# Rule One Windows Build Guide

## Build 前检查

- 操作系统：Windows 10/11
- 已安装 Node.js、npm、Rust、Visual Studio C++ Build Tools、WebView2 Runtime
- 当前目录：`apps/desktop`
- 先运行基础验证：
  - `npm test`
  - `npm run build`
  - `cargo check`
- 当前版本 Windows bundle 配置：
  - `productName = "Rule One"`
  - `version = "0.1.0"`
  - `identifier = "com.ruleone.desktop"`

## 本地构建命令

```bash
cd apps/desktop
npm install
npm run build:desktop
```

开发联调命令：

```bash
cd apps/desktop
npm run dev:desktop
```

## 构建成功后的产物目录

重点查看：

- `apps/desktop/src-tauri/target/release/`
- `apps/desktop/src-tauri/target/release/bundle/msi/`
- `apps/desktop/src-tauri/target/release/bundle/nsis/`

当前已验证成功生成的首轮产物：

- `apps/desktop/src-tauri/target/release/bundle/msi/Rule One_0.1.0_x64_en-US.msi`
- `apps/desktop/src-tauri/target/release/bundle/nsis/Rule One_0.1.0_x64-setup.exe`

## 如何选择首轮交付产物

当前首轮推荐优先交付：

1. `NSIS EXE`
2. `MSI` 作为备用

原因：

- `NSIS EXE` 已在当前机器上完成安装与卸载验证
- `MSI` 已成功构建，但当前验证环境下安装需要管理员权限
- 对首轮小范围内测来说，`NSIS EXE` 更适合普通用户直接安装

## 首次安装后的模型配置步骤

1. 打开应用，进入 `模型设置`
2. 选择 provider：
   - `dashscope`
   - `deepseek`
3. 填写：
   - `base_url`
   - `chat_model`
   - `reasoning_model`
   - `safety_model`
   - `timeout`
4. 点击 `保存配置`
5. 填写 API Key
6. 点击 `保存 Key`
7. 点击 `测试连接`
8. 连接成功后再开始 Daily Review

## 安装验证结论

当前机器上的实际验证结果：

- `MSI`：构建成功，安装失败，原因是需要管理员权限
- `NSIS EXE`：构建成功、安装成功、卸载成功

因此首轮交付建议以 `NSIS EXE` 为主。
