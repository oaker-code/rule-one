First Demo example using the AI-OS architecture. Help the individual inverster, manage their Trading Emotion. 采用 AI OS 架构思路实现的一个AI OS 实例，为个人投资者，管理交易方式，提供情绪价值。
# Rule One

A structured post-market review agent for traders.  
No stock picks, no trading advice — only one executable rule for tomorrow.

---

# English

## Overview

Rule One is an AI agent focused on **post-market review**.

It does **not**:
- recommend stocks
- give buy/sell advice
- predict the market
- promise returns
- push intraday signals

It does one thing only:

> It helps users turn a chaotic trading day into one executable rule for tomorrow.

Each review session always produces three fixed outputs:

- **Today's key bias**
- **One thing done well today**
- **One rule for tomorrow (Rule One)**

---

## Why this project exists

Most trading tools try to answer questions like:

- What should I buy?
- What should I sell?
- What will the market do next?

But many traders do not mainly lack information.  
They lack:

- a way to review the day after the close
- a way to see their own behavioral bias clearly
- a way to improve one thing at a time

**Rule One is a behavior system, not a market system.**

---

## What makes Rule One different

### Rule One does NOT do

- ❌ Stock recommendations
- ❌ Buy/sell timing advice
- ❌ Market prediction
- ❌ Return promises
- ❌ Intraday signal pushing
- ❌ Addictive emotional companionship

### Rule One DOES do

- ✅ Post-market review
- ✅ Structured reflection of facts / judgments / emotions / actions
- ✅ Detect **one** primary bias only
- ✅ Generate **one** rule only
- ✅ Provide low-stimulation, non-shaming feedback

---

## Example

### Input

```text
I chased in the morning, added on the pullback, and ended the day with a heavy loss.
I knew I should not add, but I was afraid of missing out.
```

### Output

```text
Today's key bias: impulsive averaging down
One thing done well: I did not increase my position further near the close
Rule One for tomorrow: If the reason to add is not new information, do not add.
```

---

## Core workflow

```text
Market close
→ Emotion check-in
→ Input today's facts
→ AI structures the review
→ AI detects the primary bias
→ AI generates Rule One
→ User confirms and saves
→ Stored into history
```

### Design goals

- Finish in **3–7 minutes**
- Low cognitive load
- Strongly structured
- Fixed and reviewable output
- No expansion into market analysis

---

## Who it is for

Rule One is for traders who:

- feel mentally chaotic after market close
- know the problem is execution, but struggle to review consistently
- do not want more predictions, only better discipline
- want to improve one thing per day instead of receiving endless advice

---

## Product principles

- **Structure over open-ended chat**
- **Order over emotional dependency**
- **One rule over many suggestions**
- **Behavior feedback over market judgment**
- **Safety boundary over “looking smart”**
- **Long-term behavior mirror over short-term stimulation**

---

## Features

### User-facing

- Daily Review
- History
- Rule Feed
- Weekly Pattern

### AI pipeline

- Emotion recognition
- Structured extraction
- Primary bias detection
- Rule generation
- Safety gate

---

## Screenshots

### Home
> The market is closed. Let's organize today.

![Home](<screenshot-url>)

### Review Flow
![Review Flow](<screenshot-url>)

### Reflection Card
![Reflection Card](<screenshot-url>)

### Weekly Pattern
![Weekly Pattern](<screenshot-url>)

---

## Tech stack

### Frontend
- React / Next.js
- TypeScript
- Tailwind CSS

### Backend
- Node.js / NestJS or Python / FastAPI
- REST API or GraphQL

### Data
- PostgreSQL
- Redis
- S3-compatible object storage

### AI orchestration
- LLM Router
- Prompt Pipeline
- Structured Output Parser
- Policy / Safety Filter

### Observability
- OpenTelemetry
- Prometheus
- Grafana
- Sentry

---

## Architecture

```text
Client Layer
  └─ Web / iOS / Android / H5

Application Layer
  └─ Auth / Review API / History / Rule Archive / Weekly Report

AI Orchestration
  └─ Emotion / Structurer / Bias Detector / Rule Generator / Safety Gate

Data Storage
  └─ PostgreSQL / Redis / Object Storage

Safety & Compliance
  └─ Content Filter / Policy / Audit

Monitoring & Ops
  └─ Logs / Metrics / Alerts / Review Quality Dashboard
```

---

## Quick Start

### 1. Clone

```bash
git clone <repo-url>
cd rule-one
```

### 2. Install

```bash
pnpm install
# or
npm install
# or
yarn
```

### 3. Configure environment

Create `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgres://user:password@localhost:5432/ruleone
REDIS_URL=redis://localhost:6379
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
LLM_API_KEY=
SAFETY_API_KEY=
```

### 4. Run

```bash
pnpm dev
# or
npm run dev
```

Open `http://localhost:3000`

---

## API preview

### Create review session

```http
POST /api/reviews
Content-Type: application/json
```

```json
{
  "emotion_label": "regret",
  "input_mode": "text",
  "raw_input": "I chased in the morning, added on the pullback, and ended the day with a heavy loss."
}
```

### Get review result

```http
GET /api/reviews/{session_id}
```

```json
{
  "emotion": "regret",
  "structured_review": {
    "facts": ["chased in the morning", "added on the pullback", "heavy loss near the close"],
    "judgments": ["expected continuation"],
    "emotions": ["fear of missing out", "regret"],
    "actions": ["chasing", "adding"]
  },
  "main_bias": "impulsive averaging down",
  "did_well": "did not increase position further near the close",
  "rule_one": "If the reason to add is not new information, do not add."
}
```

---

## Safety boundary

The system must hard-block:

- specific stock picks
- buy/sell timing advice
- up/down market predictions
- return promises or implications
- encouraging users to add to positions
- overstated product capability
- addictive, manipulative, or dependency-driven language

---

## Metrics

### North-star metric

- **Rule Completion Rate**  
  The percentage of review sessions that successfully produce a Rule One

### Process metrics

- Daily review completion rate
- Average review duration
- Drop-off rate
- History revisit rate
- Weekly report view rate
- Rule reuse rate

### Quality metrics

- Emotion recognition accuracy
- Bias classification accuracy
- Rule executability score
- Safety interception hit rate
- User satisfaction

---

## Roadmap

### Phase 1 — MVP
- [x] Text input
- [x] Structured prompts
- [x] AI structuring
- [x] Single-bias detection
- [x] Rule One generation
- [x] History storage

### Phase 2 — Enhanced
- [ ] Voice input
- [ ] Weekly report
- [ ] Rule reuse tracking
- [ ] Recurring bias detection
- [ ] Richer emotional profile

### Phase 3 — Behavior System
- [ ] Pre-market rule confirmation
- [ ] In-session cool-down reminders
- [ ] Full close-review loop
- [ ] Monthly behavior reports

---

## Contributing

Contributions, ideas, and feedback are welcome.

Suggested ways to contribute:
- improve UX copy
- add multilingual support
- improve bias taxonomy
- improve safety filtering
- improve observability and review quality dashboards

Please read `CONTRIBUTING.md` before submitting major changes.

---

## Project status

The current focus is to validate one thing:

**Will users come back daily for a 3–7 minute review and leave with one executable Rule One?**

---

## License

This project is licensed under the MIT license.  
See [LICENSE](./LICENSE) for details.

---

## Contact

Created by Entropyin 
Email: 

---

## One-line summary

Rule One is a post-market review agent OS built around one daily rule, structured reflection, behavior-bias detection, and a strict no-stock-picks safety boundary.

---

# 中文

## 项目简介

Rule One 是一个聚焦于 **收盘后复盘** 的 AI 智能体。

它**不负责**：
- 推荐股票
- 给买卖建议
- 预测行情
- 承诺收益
- 盘中带单

它只做一件事：

> 帮助用户把混乱的一天，整理成明天可执行的一条规则。

每次复盘固定输出三项：

- **今日关键偏差**
- **今日做对的一点**
- **明日一条规则（Rule One）**

---

## 为什么做这个项目

很多交易工具都在回答这些问题：

- 买什么
- 卖什么
- 市场接下来会怎样

但很多交易者真正缺的，往往不是更多信息，而是：

- 收盘后整理一天的能力
- 看见自己行为偏差的能力
- 一次只改一件事的能力

**Rule One 是行为系统，不是市场系统。**

---

## Rule One 有什么不同

### Rule One 不做这些

- ❌ 个股推荐
- ❌ 买卖时点建议
- ❌ 行情预测
- ❌ 收益承诺
- ❌ 盘中带单
- ❌ 高依赖情绪陪伴

### Rule One 只做这些

- ✅ 收盘后复盘
- ✅ 将输入整理成“事实 / 判断 / 情绪 / 动作”
- ✅ 只识别 **一个** 主偏差
- ✅ 只生成 **一条** 规则
- ✅ 提供低刺激、非羞辱式反馈

---

## 示例

### 输入

```text
今天早盘追高，回落后补仓，尾盘亏损很重。
我知道不该加仓，但还是怕错过。
```

### 输出

```text
今日关键偏差：临时加仓
今日做对的一点：尾盘没有继续放大仓位
明日一条规则：如果补仓理由不是新增信息，那么不补仓。
```

---

## 核心流程

```text
收盘进入
→ 情绪选择
→ 今日事实输入
→ AI 结构化整理
→ AI 识别主偏差
→ AI 生成 Rule One
→ 用户确认并保存
→ 写入历史记录
```

### 设计目标

- **3–7 分钟完成**
- 低认知负担
- 强结构化
- 输出固定且可回顾
- 不扩展到行情分析

---

## 适合谁

Rule One 适合这类用户：

- 收盘后容易情绪混乱，不知道怎么复盘
- 明知道问题在执行，却很难持续复盘
- 不想再看“神预测”，只想建立纪律
- 希望每天只改一件事，而不是被塞进很多建议

---

## 产品原则

- **结构化优先于开放式聊天**
- **秩序感优先于陪伴感**
- **一条规则优先于多条建议**
- **行为反馈优先于市场判断**
- **安全边界优先于“看起来很聪明”**
- **长期行为镜像优先于短期情绪刺激**

---

## 功能特性

### 用户侧

- Daily Review｜每日复盘
- History｜历史记录
- Rule Feed｜规则档案
- Weekly Pattern｜周度行为模式

### AI 流水线

- 情绪识别
- 结构化提取
- 单主偏差识别
- 明日规则生成
- 安全审查

---

## 截图

### 首页
> 收盘了，整理今天。

![Home](<screenshot-url>)

### 复盘流程
![Review Flow](<screenshot-url>)

### 复盘卡
![Reflection Card](<screenshot-url>)

### 周报页
![Weekly Pattern](<screenshot-url>)

---

## 技术栈

### 前端
- React / Next.js
- TypeScript
- Tailwind CSS

### 后端
- Node.js / NestJS 或 Python / FastAPI
- REST API 或 GraphQL

### 数据层
- PostgreSQL
- Redis
- S3 兼容对象存储

### AI 编排
- LLM Router
- Prompt Pipeline
- Structured Output Parser
- Policy / Safety Filter

### 监控
- OpenTelemetry
- Prometheus
- Grafana
- Sentry

---

## 架构概览

```text
客户端层
  └─ Web / iOS / Android / H5

应用层
  └─ Auth / Review API / History / Rule Archive / Weekly Report

AI 编排层
  └─ Emotion / Structurer / Bias Detector / Rule Generator / Safety Gate

数据存储层
  └─ PostgreSQL / Redis / Object Storage

安全与合规层
  └─ Content Filter / Policy / Audit

监控与运营层
  └─ Logs / Metrics / Alerts / Review Quality Dashboard
```

---

## 快速开始

### 1. 克隆项目

```bash
git clone <repo-url>
cd rule-one
```

### 2. 安装依赖

```bash
pnpm install
# or
npm install
# or
yarn
```

### 3. 配置环境变量

创建 `.env.local`：

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgres://user:password@localhost:5432/ruleone
REDIS_URL=redis://localhost:6379
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
LLM_API_KEY=
SAFETY_API_KEY=
```

### 4. 启动开发环境

```bash
pnpm dev
# or
npm run dev
```

打开 `http://localhost:3000`

---

## API 示例

### 创建复盘会话

```http
POST /api/reviews
Content-Type: application/json
```

```json
{
  "emotion_label": "懊悔",
  "input_mode": "text",
  "raw_input": "今天早盘追高，回落后补仓，尾盘亏损很重。"
}
```

### 获取复盘结果

```http
GET /api/reviews/{session_id}
```

```json
{
  "emotion": "懊悔",
  "structured_review": {
    "facts": ["早盘追高", "回落后补仓", "尾盘亏损"],
    "judgments": ["预期继续上涨"],
    "emotions": ["怕错过", "懊悔"],
    "actions": ["追涨", "补仓"]
  },
  "main_bias": "临时加仓",
  "did_well": "尾盘没有继续放大仓位",
  "rule_one": "如果补仓理由不是新增信息，那么不补仓。"
}
```

---

## 安全边界

系统必须强拦截：

- 具体股票推荐
- 买卖时点建议
- 上涨下跌预测
- 收益暗示或承诺
- 引导继续加仓
- 夸大系统能力
- 依赖性、操控性、亲密型话术

---

## 核心指标

### 北极星指标

- **Rule Completion Rate**  
  进入复盘后成功生成 Rule One 的比例

### 过程指标

- 日复盘完成率
- 平均复盘时长
- 中断率
- 历史页回访率
- 周报查看率
- 规则复用率

### 质量指标

- 情绪识别准确率
- 偏差分类准确率
- Rule One 可执行性评分
- 安全拦截命中率
- 用户满意度

---

## 路线图

### Phase 1 — MVP
- [x] 文本输入
- [x] 固定问题复盘
- [x] AI 结构化整理
- [x] 单偏差识别
- [x] Rule One 输出
- [x] 历史记录保存

### Phase 2 — 增强版
- [ ] 语音输入
- [ ] 周报
- [ ] 规则复用追踪
- [ ] 高频偏差识别
- [ ] 更细情绪画像

### Phase 3 — 行为系统版
- [ ] 盘前规则确认
- [ ] 盘中冷静提醒
- [ ] 收盘复盘闭环
- [ ] 月度行为报告

---

## 参与贡献

欢迎提交想法、反馈和代码贡献。

建议参与方式：
- 改进产品文案和交互体验
- 增加多语言支持
- 优化偏差标签体系
- 优化安全拦截策略
- 完善监控与复盘质量看板

提交较大改动前，请先阅读 `CONTRIBUTING.md`。

---

## 项目状态

当前项目重点验证的是一件事：

**用户是否愿意每天回来做一次 3–7 分钟复盘，并带走一条可执行的 Rule One。**

---

## 许可证

本项目采用 **<license>** 许可证。  
详见 [LICENSE](./LICENSE)。

---

## 联系方式

作者：Entropyin
邮箱：

---

## 一句话总结

Rule One 是一个以“每日一条规则”为核心产物、以“结构化复盘”为主流程、以“行为偏差识别”为智能核心、以“非荐股安全边界”为底座的复盘智能体OS。
