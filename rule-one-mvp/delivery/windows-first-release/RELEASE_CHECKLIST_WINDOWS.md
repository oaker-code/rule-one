# Rule One Windows Release Checklist

## 构建前检查

- 当前分支代码已确认可交付
- `apps/desktop/src-tauri/tauri.conf.json` 已确认：
  - `productName = "Rule One"`
  - `version = "0.1.0"`
  - `identifier = "com.ruleone.desktop"`
  - `bundle.active = true`
- 图标文件存在
- `npm test` 通过
- `npm run build` 通过
- `cargo check` 通过

## 构建验证

- 执行 `npm run build:desktop`
- 构建过程无报错
- 成功产物已生成到：
  - `src-tauri/target/release/bundle/msi/`
  - `src-tauri/target/release/bundle/nsis/`
- 安装包名称与版本号正确

## 安装验证

- `NSIS EXE`：已验证可安装、可卸载
- `MSI`：已验证可构建，但当前环境下安装需要管理员权限
- 开始菜单快捷方式可创建
- 卸载后安装目录与卸载项可清理

## 功能验证

- 首页正常显示
- 模型设置页面可打开
- 普通配置可保存
- API Key 可保存并测试连接
- Daily Review 可提交
- Result 页可展示
- 保存后 History 可看到记录
- History 顶部行为摘要可正常展示

## 数据验证

- SQLite 文件落在应用数据目录，不在源码目录
- API Key 不写入 SQLite
- 旧数据没有 `rule_tag` 时，History 页面仍可打开

## 卸载验证

- `NSIS EXE` 卸载已验证通过
- 卸载后确认：
  - 安装目录已移除
  - 当前用户卸载项已移除
  - 开始菜单快捷方式已移除

## 交付物整理

- 首轮主交付包：`NSIS EXE`
- 备用包：`MSI`
- 一并提供文档：
  - `docs/BUILD_WINDOWS.md`
  - `docs/FIRST_DELIVERY_NOTES.md`
  - `docs/DEMO_CHECKLIST.md`
- 对外说明当前版本为本地桌面 MVP，而非正式生产版
