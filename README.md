# GoldMaster Frontend — Web Publish

نسخة المنشور للمستعرض (Vercel) من نظام جولد ماستر لإدارة محلات الذهب.

> **مستودع موازٍ مستقل عن مونوربو الباك إند** (`GoldeManger/`). السبب: الباك ASP.NET يُنشر خارج Vercel (runasp)، فالمونوربو يربك كشف Vercel للإطار (يفشل النشر) ولا يقدّم أي منفعة هنا.

## النشر على Vercel

1. **استورد هذا المستودع** في Vercel (Root Directory = الجذر).
2. **Framework Preset**: Vite.
3. **Node.js**: 22.x (يتطلب ≥ 20.19 لكل Vite 8 / TS 6).
4. **Environment Variables** (برسم Production وPreview):
   - `VITE_API_URL` = **فارغ** — الموقع يعمل عبر وسيط `vercel.json` (Rewrites) الذي يمُرّر `/api/*` و `/uploads/*` خلف الكواليس إلى `http://goldmaster.runasp.net/` (أوريغين موحّد HTTPS، بلا Mixed Content وبلا CORS).
   - `VITE_SITE_URL` = رابط الموقع النهائي (يُستخدم في canonical / og:url / sitemap / og:image)
   - للديوف محلياً: أنشئ `.env.local` وضبط `VITE_API_URL=http://localhost:5086/`.

> `.env` في المستودع **غير مرفوع** (متجاهل). فالباك الافتراضي في الكود الآن Same-Origin (`''`) — إن نُسِيَ `VITE_API_URL` في Vercel لن يتعطل الموقع، بل تستمر النداءات إلى `/api/*` عبر الوسيط. لا تضع `http://` للباك إند في Production لأن الباك إند لا يدعم HTTPS ويُحجب بـ Mixed Content.

## حماية PWA

`vercel.json` يؤمّن SPA fallback عبر `rewrites` إلى `index.html`. الـ manifest يبدأ من `/app`.

## البناء محلياً

```bash
npm install
npm run typecheck
npm run lint
npm run build
```
