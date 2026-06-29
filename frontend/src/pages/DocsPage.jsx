import { useState } from 'react';

const sections = [
  {
    id: 'overview', title: '📖 معرفی سامانه', icon: '📖',
    content: `سامانه FindMe یک پلتفرم هوشمند برای کمک به یافتن افراد گمشده است. این سامانه از هوش مصنوعی VGG-Face برای تطبیق چهره و پایگاه داده متادیتا برای جستجوی پیشرفته استفاده می‌کند.

ویژگی‌های اصلی:
• ثبت‌نام و ورود امن با توکن JWT
• ثبت گزارش افراد گمشده یا پیدا شده
• تطبیق چهره با هوش مصنوعی (DeepFace/VGG-Face)
• جستجوی پیشرفته با فیلترهای متعدد
• پانل مدیریت برای تأیید گزارش‌ها
• کنترل دسترسی مبتنی بر نقش (RBAC)`
  },
  {
    id: 'user-guide', title: '👤 راهنمای کاربر', icon: '👤',
    content: `ثبت‌نام و ورود:
۱. روی "ورود / ثبت‌نام" در منوی بالا کلیک کنید
۲. تب "ثبت‌نام" را انتخاب و فرم را تکمیل کنید
۳. پس از ثبت‌نام، به‌طور خودکار وارد سامانه می‌شوید

ثبت گزارش:
۱. از منو "ثبت گزارش" را انتخاب کنید
۲. اطلاعات فرد گمشده یا پیدا شده را وارد کنید
۳. یک عکس واضح از فرد آپلود کنید
۴. روی "ثبت گزارش" کلیک کنید
۵. گزارش شما پس از تأیید مدیر در سامانه نمایش داده می‌شود

جستجو با فیلتر:
۱. از منو "جستجو" را انتخاب کنید
۲. تب "جستجو با فیلتر" را انتخاب کنید
۳. فیلدهای مورد نظر را پر کنید
۴. روی "جستجو" کلیک کنید

جستجو با تطبیق چهره (AI):
۱. از منو "جستجو" را انتخاب کنید
۲. تب "تطبیق چهره با هوش مصنوعی" را انتخاب کنید
۳. عکس فرد را آپلود کنید
۴. روی "شروع جستجوی هوشمند" کلیک کنید`
  },
  {
    id: 'admin-guide', title: '🛡️ راهنمای مدیر', icon: '🛡️',
    content: `ورود مدیر:
نام کاربری پیش‌فرض: admin
رمز عبور پیش‌فرض: admin1234

داشبورد:
• مشاهده آمار کلی سامانه
• تعداد پرونده‌های ثبت‌شده، تأیید شده، در انتظار
• نرخ تأیید گزارش‌ها

تأیید گزارش‌ها:
۱. به تب "در انتظار تأیید" بروید
۲. جزئیات هر گزارش را بررسی کنید
۳. روی "تأیید" کلیک کنید تا در سامانه نمایش داده شود
۴. روی "رد" کلیک کنید تا گزارش حذف شود

مدیریت کاربران:
۱. به تب "کاربران" بروید
۲. می‌توانید نقش کاربران را تغییر دهید (کاربر / مدیر)
۳. می‌توانید حساب کاربری را فعال یا غیرفعال کنید`
  },
  {
    id: 'security', title: '🔒 معماری امنیتی', icon: '🔒',
    content: `احراز هویت:
• رمزهای عبور با SHA-256 هش می‌شوند
• توکن‌های session به‌صورت تصادفی (secrets.token_hex) تولید می‌شوند
• توکن‌ها پس از ۷ روز منقضی می‌شوند

کنترل دسترسی (RBAC):
• نقش کاربر (user): می‌تواند گزارش ثبت کند و جستجو کند
• نقش مدیر (admin): دسترسی کامل به پانل مدیریت

امنیت فایل‌ها:
• نام فایل‌های تصویری با token_hex تصادفی تولید می‌شوند
• فایل‌های موقت بلافاصله پس از استفاده حذف می‌شوند

CORS:
• در محیط توسعه CORS برای همه origin‌ها باز است
• در محیط production باید به دامنه‌های مجاز محدود شود

Middleware های امنیتی توصیه‌شده برای production:
• Rate Limiting (با slowapi)
• HTTPS (با Nginx + Let's Encrypt)
• محدود کردن CORS به دامنه مشخص`
  },
  {
    id: 'api', title: '⚙️ مستندات API', icon: '⚙️',
    content: `مستندات کامل API در آدرس زیر قابل دسترسی است:
http://127.0.0.1:8000/docs (Swagger UI)
http://127.0.0.1:8000/redoc (ReDoc)

Endpoints اصلی:

احراز هویت:
• POST /auth/register - ثبت‌نام
• POST /auth/login - ورود
• POST /auth/logout - خروج
• GET  /auth/me - اطلاعات کاربر جاری

پرونده‌ها (عمومی):
• GET  /persons/ - لیست پرونده‌ها
• GET  /persons/{id} - جزئیات پرونده
• GET  /persons/search - جستجو با فیلتر

پرونده‌ها (احراز هویت):
• POST /persons/submit - ثبت گزارش
• POST /persons/match-face - تطبیق چهره با AI

پانل مدیریت:
• GET  /admin/stats - آمار
• GET  /admin/pending - گزارش‌های در انتظار
• POST /admin/approve/{id} - تأیید
• POST /admin/reject/{id} - رد
• GET  /admin/users - مدیریت کاربران`
  },
  {
    id: 'stack', title: '🛠️ پشته فناوری', icon: '🛠️',
    content: `Backend:
• Python 3.11
• FastAPI - وب فریمورک سریع
• SQLAlchemy - ORM برای SQLite
• DeepFace (VGG-Face) - تشخیص چهره
• Uvicorn - سرور ASGI

Frontend:
• React 19 + Vite
• CSS3 با Glassmorphism
• Axios / Fetch API
• RTL Layout برای فارسی

AI Models:
• DeepFace VGG-Face - تشخیص و تطبیق چهره
• MTCNN / RetinaFace - تشخیص موقعیت چهره

Database:
• SQLite (توسعه) - قابل ارتقا به PostgreSQL

استقرار (Production):
• Nginx به عنوان Reverse Proxy
• Gunicorn + Uvicorn Workers
• Docker + Docker Compose`
  },
];

export default function DocsPage() {
  const [active, setActive] = useState('overview');
  const current = sections.find(s => s.id === active);

  return (
    <div className="docs-page fade-in">
      <div className="docs-sidebar glass">
        <h3>📚 فهرست مطالب</h3>
        {sections.map(s => (
          <button key={s.id} className={active === s.id ? 'active' : ''}
            onClick={() => setActive(s.id)}>
            {s.icon} {s.title}
          </button>
        ))}
      </div>
      <div className="docs-content glass">
        <h2>{current?.title}</h2>
        <pre className="docs-pre">{current?.content}</pre>
      </div>
    </div>
  );
}
