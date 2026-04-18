# Rule One First Windows Delivery

## 推荐交付包

- 主安装包：`Rule One_0.1.0_x64-setup.exe`
- 备用安装包：`Rule One_0.1.0_x64_en-US.msi`

## 推荐发放方式

首轮建议优先发放 `NSIS EXE`。

原因：

- 已完成本机安装验证
- 已完成本机卸载验证
- 对普通用户更友好

`MSI` 当前作为备用包保留。它已成功构建，但当前验证环境下安装需要管理员权限。

## 附带文档

- `BUILD_WINDOWS.md`
- `RELEASE_CHECKLIST_WINDOWS.md`
- `FIRST_DELIVERY_NOTES.md`
- `DEMO_CHECKLIST.md`

## 发给内测用户时建议说明

1. 先安装 `Rule One_0.1.0_x64-setup.exe`
2. 首次打开后先进入 `模型设置`
3. 保存 provider 配置
4. 保存 API Key
5. 点击 `测试连接`
6. 再开始 Daily Review 演示
