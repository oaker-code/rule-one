# Rule One First Delivery Notes

## 版本定位

当前版本是 `Rule One` 本地桌面版 MVP，目标是完成第一轮可安装、可配置、可演示、可保存本地复盘数据的交付。

## 数据边界

- 业务数据使用本地 SQLite 保存
- API Key 由用户自行填写
- API Key 使用系统安全存储，不进入 SQLite
- 当前版本强调本地优先，不依赖云端账号体系

## 首轮演示推荐流程

1. 打开应用，展示首页
2. 进入 `模型设置`
3. 配置 provider 和模型参数
4. 保存 API Key
5. 执行 `测试连接`
6. 回到首页，进入 `开始复盘`
7. 填写一条 Daily Review
8. 生成并展示 Result
9. 保存本次复盘
10. 打开 History
11. 展示历史详情与顶部行为摘要

## 已支持什么

- Windows 本地桌面运行
- 本地 SQLite 数据存储
- 系统安全存储 API Key
- provider 配置保存
- `dashscope / qwen`
- `deepseek`
- 最小可用 Review AI Pipeline
- Result 保存到本地数据库
- History 查看与行为摘要 Top 3
- Windows 安装包构建

## 暂不支持什么

- 多用户体系
- 云端同步
- 自动升级分发
- 完整生产级日志与遥测
- 更细粒度的分析报表
- 移动端版本

## 首轮交付建议

- 首轮主交付包推荐使用 `NSIS EXE`
- `MSI` 可作为备用包，但当前验证环境下安装需要管理员权限
- 演示时优先使用已验证可联通的 provider 配置
- 内测反馈重点关注：
  - 安装是否顺畅
  - 模型配置是否清晰
  - Daily Review 到 History 的主流程是否稳定
  - 本地数据与 API Key 的边界是否易理解
