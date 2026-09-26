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
- 补差额：发起时约定付款方与金额，物主同意后先生成待补款，到账登记后进入交换中；取消或拒绝后已到账金额保留为待退回，可登记退回；列表、详情、个人页均展示待付/已付/退回金额。
- 个人中心，编辑资料、上传头像、查看我发布的物品、查看补差额账本。
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
├── api/              # userApi.ts, itemApi.ts, exchangeApi.ts：本地数据 API 层
├── stores/           # authStore.ts, itemStore.ts, exchangeStore.ts, themeStore.ts
├── models/           # user.ts, item.ts, exchange.ts：独立数据模型
├── types/            # 共享类型补充
├── components/common/# 共享业务组件和 GlobalErrorBoundary（含 CompensationSummary、ExchangeCard）
├── hooks/            # useAuth.ts, useLocalStorage.ts, useExchangeStats.ts, useCompensationStats.ts
├── pages/            # Home, ItemDetail, Publish, Exchanges, ExchangeDetail, Profile
├── router/           # index.ts + guards.ts
├── utils/            # storage.ts, formatters.ts, validators.ts, compensation.ts, message.ts, themeUtils.ts
├── constants/        # item.ts, exchange.ts, themes.ts, messages.ts
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
- `src/stores/exchangeStore.ts`
- `src/router/guards.ts`
- `src/utils/formatters.ts`
- `src/utils/compensation.ts`
- `src/hooks/useExchangeStats.ts`
- `src/hooks/useCompensationStats.ts`
- `src/components/common/ExchangeCard.vue`
- `src/components/common/CompensationSummary.vue`
- `src/pages/ItemDetail.vue`
- `src/pages/Exchanges.vue`
- `src/pages/ExchangeDetail.vue`
- `src/pages/Profile.vue`

## 补差额（补差款）功能

双方物品价值不等时，可在发起交换时约定补差价，而不再依赖口头约定：

- **发起交换**（`pages/ItemDetail.vue`）：勾选“约定补差价”，选择付款方（发起方或物主）并填写金额（正数、最多两位小数，校验在 `utils/validators.ts`）。
- **物主同意**（`api/exchangeApi.ts` 的 `accept`）：需要补款时先生成待补款，状态进入 `待补款(paying)`；无需补款直接进入 `交换中(accepted)`。
- **到账登记**：收款人线下收款后点击“登记到账”（`registerPayment`），登记成功交换才进入交换中。一笔交换只认一笔补款，按约定金额一次性写入，重复登记直接报错、不累加。
- **取消 / 拒绝**：待确认可由物主拒绝、发起方取消；待补款与交换中可由任一方取消。取消或拒绝后已到账金额保留并显示为“待退回”，线下退款后通过“登记退回”（`registerRefund`）核销。
- **金额展示**：列表卡片（`ExchangeCard` + `CompensationSummary`）、交换详情页（`pages/ExchangeDetail.vue`，路由 `/exchanges/:id`）和个人页“补差额账本”（`useCompensationStats`）均可看到待付、已付、待退回、已退回金额。
- **旧数据兼容**：历史交换请求缺少补款字段，读取时由 `exchangeApi.list()` 归一化，统一按“无需补款”处理。
- 金额计算统一收口在 `src/utils/compensation.ts`，金额格式化统一使用 `formatters.ts` 的 `formatMoney`。

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
