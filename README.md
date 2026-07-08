# 🎌 日语学习助手

输入中文 → 敬语 & タメ口 两种日语翻译，带假名和罗马字读音。

---

## 🌐 分享给别人（只需做一次）

### 你需要做的事（2 分钟）

**1. 获取免费 DeepSeek Key**

去 [platform.deepseek.com](https://platform.deepseek.com/api_keys) 注册 → 创建 API Key（新用户免费）。

**2. 部署到 Vercel**

把项目上传到 GitHub，然后打开 [vercel.com](https://vercel.com)，用 GitHub 登录：

- 点 **New Project** → 选择仓库 → 展开 **Environment Variables**
- 添加：`DEEPSEEK_API_KEY` = 你的 DeepSeek Key（sk-...）
- 点 **Deploy**

**3. 分享链接**

部署完你会得到一个 `https://xxx.vercel.app` 地址。**把这个链接发给别人，他们打开就能用，无需任何设置。**

---

## 💻 本地使用

```bash
cd ~/Desktop/japanese-learner
python3 proxy.py                # 启动本地代理
open index.html                 # 浏览器打开
```

本地模式需要在设置里填自己的 DeepSeek Key。

---

## 🛠 文件说明

| 文件 | 用途 |
|------|------|
| `index.html` | 前端页面 |
| `api/translate.js` | Vercel 线上 API（Key 藏在这里） |
| `proxy.py` | 本地开发 CORS 代理 |
| `vercel.json` | Vercel 配置 |
