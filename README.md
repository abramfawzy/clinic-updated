# Clinic Web (Frontend)

واجهة منصة حجز الكشوفات الطبية. React 18 + Vite + JavaScript.

## التشغيل

```bash
cd clinic-web
npm install
cp .env.example .env.local     # على ويندوز: copy .env.example .env.local
npm run dev
```

افتح http://localhost:5173

## أوضاع التشغيل (`.env.local`)

| `VITE_USE_MOCKS` | المعنى |
|---|---|
| `true` | كل حاجة بيانات تجريبية، من غير باك إند |
| `partial` | **الافتراضي**: كل اللي في قايمة الـ endpoints حقيقي (الدخول، الأطباء، الحجز، المواعيد، السجل الطبي، المرفقات، الكوبونات، الدكتور، الأدمن). والتجريبي بس: الشات، التقييم، تقارير الأدمن، قايمة مواعيد الاستقبال |
| `false` | كله من الباك |

بعد تغيير `.env.local` اعمل restart لـ `npm run dev`.

## الربط مع الباك إند

- الـ proxy في `vite.config.js` بيبعت `/api` و`/hubs` للسيرفر في `VITE_PROXY_TARGET` (الافتراضي `https://depi-e-commerce.runasp.net`)، فمفيش CORS.
- لباك على جهازك: `VITE_PROXY_TARGET=https://localhost:7011`.
- كل الـ endpoints في `src/features/*/*Api.js`، وتحويل الـ responses لشكل الصفحات في `*Mappers.js` (`doctorMappers`, `appointmentMappers`). لو اسم حقل في الـ API اختلف، بيتعدل هناك بس.
- الـ mocks: `handlers.real.js` و`handlers.booking.js` (بنفس عقد الباك، وضع `true` بس) و`handlers.pending.js` (اللي الباك لسه ما عملهوش).

### حسابات الوضع التجريبي الكامل (`true`)
كلمة السر `123456`: patient@demo.com / doctor@demo.com / admin@demo.com / reception@demo.com

## الهيكل

```
src/
├── app/            router، guards، layouts
├── shared/         axios، i18n (ar/en)، components، hooks، SignalR، format
├── features/
│   ├── auth/       Login / Register / JWT store
│   ├── doctors/    الرئيسية، البحث والفلترة، ملف الدكتور والـ Slots
│   ├── booking/    الحجز، مواعيدي، العداد التنازلي، الشات
│   ├── payments/   نتيجة الدفع + بوابة Sandbox تجريبية
│   ├── medical/    التاريخ المرضي والمرفقات
│   ├── doctor/     الأجندة، أوقات العمل، الإجازات
│   ├── admin/      الإحصائيات، اعتماد الأطباء، العيادات والتخصصات والكوبونات
│   └── reception/  مواعيد اليوم، تسجيل الوصول، تأكيد الدفع
└── mocks/          MSW (db, handlers.real, handlers.pending)
```

## ملاحظات

- الحماية بالأدوار في الفرونت للتجربة بس. الأمان الحقيقي في الـ API.
- الأسعار والخصومات في صفحة الحجز معاينة فقط. السعر النهائي (`PriceSnapshot`) بيتحسب في الباك.
- عربي/إنجليزي مع RTL، وDark/Light محفوظين في `localStorage`.
- الـ JWT بيتخزن في `localStorage` (مناسب لمشروع تخرج). لو الأمان أهم، الأفضل httpOnly cookie من الباك.

## Git (مع الفريق)

```bash
git checkout develop && git pull
git checkout -b feature/frontend
# اشتغل جوه clinic-web/ بس
git add clinic-web && git commit -m "feat(frontend): ..."
git push -u origin feature/frontend
# افتح Pull Request إلى develop
```

ما تلمسش ملفات الباك. و`node_modules` و`.env.local` متجاهلين في `.gitignore`.
