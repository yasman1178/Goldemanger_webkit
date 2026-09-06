# GoldMaster Frontend — Web Publish

نسخة المنشور للمستعرض (Vercel) من نظام جولد ماستر لإدارة محلات الذهب.

> **مستودع موازٍ مستقل عن مونوربو الباك إند** (`GoldeManger/`). السبب: الباك ASP.NET يُنشر خارج Vercel (runasp)، فالمونوربو يربك كشف Vercel للإطار (يفشل النشر) ولا يقدّم أي منفعة هنا.

## النشر على Vercel

1. **استورد هذا المستودع** في Vercel (Root Directory = الجذر).
2. **Framework Preset**: Vite.
3. **Node.js**: 22.x (يتطلب ≥ 20.19 لكل Vite 8 / TS 6).
4. **Environment Variables** (برسم Production وPreview):
   - `VITE_API_URL` = `http://goldmaster.runasp.net/`
   - `VITE_SITE_URL` = رابط الموقع النهائي (يُستخدم في canonical / og:url / sitemap / og:image)

> `.env` في المستودع **غير مرفوع** (متجاهل). بدون `VITE_API_URL` في Vercel، سيعود الكود إلى `http://localhost:5000` ويُعطّل الموقع المنشور — اضبط المتغير دائماً.

## حماية PWA

`vercel.json` يؤمّن SPA fallback عبر `rewrites` إلى `index.html`. الـ manifest يبدأ من `/app`.

## البناء محلياً

```bash
npm install
npm run typecheck
npm run lint
npm run build
```
