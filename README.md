# ReSwap 二手闲置物品交换平台

```bash
pnpm install
pnpm dev
```

访问地址：`http://localhost:18415`

## 项目介绍

ReSwap 是一个纯前端以物换物 Web 应用。用户可以本地模拟登录、发布闲置物品、浏览他人物品、发起交换请求，并在浏览器内管理交换记录。

## 主要功能

- 首页瀑布流浏览、分类筛选、关键词搜索。
- 物品详情、物主资料、选择自己的物品发起交换。
- 发布物品，支持本地 base64 图片上传、分类和成色选择。
- 交换管理，区分我发起的和我收到的请求，支持同意、拒绝、取消、完成。
- 补差额：价值不等时约定差价付款方与金额，待补款、到账登记、退回登记全流程可追踪。
- 个人中心，编辑资料、上传头像、查看我发布的物品和补款金额汇总。
- 主题切换、全局错误处理和 Vant 提示。

## 启动与构建

```bash
pnpm install
pnpm dev
```

```bash
pnpm build
```

生产部署：执行 `pnpm build` 后，将 `dist/` 目录交给 Nginx 或任意静态文件服务器托管。

## 技术栈

| 类型 | 技术 |
| --- | --- |
| 框架 | Vue 3 + TypeScript |
| 构建 | Vite |
| 状态管理 | Pinia |
| 路由 | Vue Router 4 |
| UI | Vant + Tailwind CSS |
| 持久化 | localStorage + IndexedDB（idb-keyval） |
| 工具库 | dayjs、lodash-es |

## 项目目录结构

```text
src/
├── api/              # userApi.ts, itemApi.ts, exchangeApi.ts, compensationApi.ts：本地数据 API 层
├── stores/           # authStore.ts, itemStore.ts, exchangeStore.ts, themeStore.ts
├── models/           # user.ts, item.ts, exchange.ts, compensation.ts：独立数据模型
├── types/            # 共享类型补充
├── components/common/# 共享业务组件和 GlobalErrorBoundary
├── hooks/            # useAuth.ts, useLocalStorage.ts, useExchangeStats.ts, useCompensationStats.ts
├── pages/            # Home, ItemDetail, Publish, Exchanges, ExchangeDetail, Profile
├── router/           # index.ts + guards.ts
├── utils/            # storage.ts, formatters.ts, validators.ts, compensation.ts, message.ts, themeUtils.ts
├── constants/        # item.ts, exchange.ts, compensation.ts, themes.ts, messages.ts
├── App.vue
├── main.ts
└── styles.css
```

## 数据持久化说明

- `utils/storage.ts` 统一封装 localStorage 和 IndexedDB。
- 所有 `api/*Api.ts` 通过 `storage.ts` 读写数据，不在组件里直接写业务数据。
- 存储层包含序列化、版本号、过期清理、存储 key 管理。
- 首次启动会写入演示用户、物品和交换请求。

## 横切关注点

- 主题切换：`stores/themeStore.ts`、`constants/themes.ts`、`utils/themeUtils.ts`、`App.vue`、`components/common/CategoryFilter.vue`、`components/common/UserBrief.vue`、`components/common/ItemCard.vue`。
- 全局错误处理/提示：`utils/message.ts`、`components/common/GlobalErrorBoundary.tsx`、`stores/authStore.ts`、`stores/itemStore.ts`、`stores/exchangeStore.ts`、`components/common/ImageUploader.vue`。

## 枚举出现位置清单

### ItemStatus

定义位置：`src/constants/item.ts`

出现位置：

- `src/models/item.ts`
- `src/constants/messages.ts`
- `src/api/itemApi.ts`
- `src/api/exchangeApi.ts`
- `src/stores/itemStore.ts`
- `src/router/guards.ts`
- `src/utils/formatters.ts`
- `src/components/common/ItemCard.vue`
- `src/pages/ItemDetail.vue`
- `src/pages/Publish.vue`
- `src/pages/Profile.vue`

### ExchangeStatus

定义位置：`src/constants/exchange.ts`

出现位置：

- `src/models/exchange.ts`
- `src/constants/messages.ts`
- `src/api/exchangeApi.ts`
- `src/api/compensationApi.ts`
- `src/stores/exchangeStore.ts`
- `src/router/guards.ts`
- `src/utils/formatters.ts`
- `src/utils/compensation.ts`
- `src/hooks/useExchangeStats.ts`
- `src/components/common/ExchangeCard.vue`
- `src/components/common/CompensationPanel.vue`
- `src/pages/ItemDetail.vue`
- `src/pages/Exchanges.vue`
- `src/pages/ExchangeDetail.vue`

值：`PENDING`（待确认）、`AWAITING_PAYMENT`（待补款）、`ACCEPTED`（交换中）、`REJECTED`（已拒绝）、`COMPLETED`（已完成）、`CANCELLED`（已取消）。

### CompensationStatus / CompensationPayer

定义位置：`src/constants/compensation.ts`

出现位置：

- `src/models/compensation.ts`
- `src/models/exchange.ts`
- `src/constants/messages.ts`
- `src/api/compensationApi.ts`
- `src/api/exchangeApi.ts`
- `src/stores/exchangeStore.ts`
- `src/utils/formatters.ts`
- `src/utils/compensation.ts`
- `src/utils/validators.ts`
- `src/hooks/useCompensationStats.ts`
- `src/components/common/CompensationPanel.vue`
- `src/components/common/ExchangeCard.vue`
- `src/pages/ItemDetail.vue`
- `src/pages/Exchanges.vue`
- `src/pages/ExchangeDetail.vue`
- `src/pages/Profile.vue`

值：`CompensationStatus` 为 `PENDING`（待补款）、`PAID`（已到账）、`REFUNDING`（待退回）、`REFUNDED`（已退回）；`CompensationPayer` 为 `INITIATOR`（发起方补款）、`OWNER`（物主补款）。

## 补差额（差价补偿）流程

双方物品价值不等时，可在发起交换时勾选“需要补差价”，选择付款方（发起方/物主）并填写金额：

1. 发起时随请求写入补款约定，物主在待确认页同意。
2. 物主同意时：有补款则生成**一笔**待补款，交换进入“待补款”；无补款直接进入“交换中”。
3. 付款方线下转账后，由**收款方**登记到账；登记成功交换才进入“交换中”。一笔交换只认一笔补款，重复登记不累加。
4. 交换被拒绝或取消时，已到账金额**保留**为“待退回”，登记退回后变为“已退回”；未到账的待补款不保留金额。
5. 列表（ExchangeCard）、详情（`/exchange/:id`）与个人中心均展示待付、已付、待退回、已退回金额（收款方视角显示待收/已收/待退还）。旧请求没有补款约定，按“无需补款”处理。

## 分层与高耦合约束

本项目保留提示词要求的“严禁合并职责到单一文件”：模型、常量、API、store、页面、组件、hooks、utils 均独立拆分。

同时保留“屎山代码设计要求”的低内聚高耦合特征：

- `utils/formatters.ts` 同时负责日期、物品状态、交换状态、成色、信用等级文本。
- `constants/messages.ts` 同时包含页面提示、表单校验、日志式文案和状态文案。
- `ItemStatus` 与 `ExchangeStatus` 被模型、API、store、组件、页面、router guards、formatters 多处引用。
- `utils/storage.ts` 是存储入口，但全应用 API 和 store 都依赖它的 key 与数据结构。

例如新增 `ItemStatus.BOOKED` 时，应至少修改：`src/constants/item.ts`、`src/models/item.ts`、`src/api/itemApi.ts`、`src/api/exchangeApi.ts`、`src/stores/itemStore.ts`、`src/router/guards.ts`、`src/utils/formatters.ts`、`src/constants/messages.ts`、`src/components/common/ItemCard.vue`、`src/pages/ItemDetail.vue`、`src/pages/Publish.vue` 等文件。

## 环境变量

当前项目无必需环境变量。

## License

MIT
