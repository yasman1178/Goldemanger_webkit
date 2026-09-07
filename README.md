# GoldMaster Frontend — Web Publish

نسخة المنشور للمستعرض (Vercel) من نظام جولد ماستر لإدارة محلات الذهب.

> **مستودع موازٍ مستقل عن مونوربو الباك إند** (`GoldeManger/`). السبب: الباك ASP.NET يُنشر خارج Vercel (runasp)، فالمونوربو يربك كشف Vercel للإطار (يفشل النشر) ولا يقدّم أي منفعة هنا.

## النشر على Vercel

1. **استورد هذا المستودع** في Vercel (Root Directory = الجذر).
2. **Framework Preset**: Vite.
3. **Node.js**: 22.x (يتطلب ≥ 20.19 لكل Vite 8 / TS 6).
4. **Environment Variables** (برسم Production وPreview):
   - `VITE_API_URL` = **فارغ** أو غير مضبوط — الكود يُلغي تلقائياً أي قيمة بعيدة (غير localhost) ويرسل الطلبات نفس الأوريغين عبر وسيط `vercel.json` (Rewrites) الذي يمُرّر `/api/*` و `/uploads/*` خلف الكواليس إلى `https://goldmaster.runasp.net/` (بلا CORS ولا Mixed Content).
   - `VITE_SITE_URL` = رابط الموقع النهائي (يُستخدم في canonical / og:url / sitemap / og:image)
   - للديوف محلياً: اتركه فارغاً فتمرّ الطلبات عبر `vite.config.ts` (server.proxy → `https://goldmaster.runasp.net`)، أو ضبط `VITE_API_URL=http://localhost:5086/` للاتصال المباشر بخادم محلي.

> `.env` في المستودع **غير مرفوع** (متجاهل). فالكود يعتمد Same-Origin (`''`): أي `VITE_API_URL` بعيد (كـ `https://goldmaster.runasp.net`) يُتجاهَل لأكثر أماناً من CORS، ولا يمكن أن يظهر طلب مباشر من المتصفح للباك إند مرة أخرى.

## حماية PWA

`vercel.json` يؤمّن SPA fallback عبر `rewrites` إلى `index.html`. الـ manifest يبدأ من `/app`.

## البناء محلياً

```bash
npm install
npm run typecheck
npm run lint
npm run build
```
