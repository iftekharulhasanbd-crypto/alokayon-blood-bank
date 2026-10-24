# আলোকায়ন ফাউন্ডেশন ও আলোকায়ন ব্লাড ব্যাংক — ওয়েবসাইট সেটআপ

এই ফোল্ডারে বাংলা Hind Siliguri ফন্ট, responsive ওয়েবসাইট, মূল লোগো, রক্তদাতা নিবন্ধন, চট্টগ্রাম এলাকার ফিল্টার, জরুরি রক্তের অনুরোধ এবং অ্যাডমিন লগইনের প্রাথমিক কোড আছে।

## গুরুত্বপূর্ণ সীমাবদ্ধতা
- ফাইলগুলো প্রকাশ করলেই ডেটাবেজ কাজ শুরু করবে না। Supabase project তৈরি করে সেটআপ করতে হবে।
- Supabase-এর publishable/anon key ব্রাউজারে ব্যবহারের জন্য; **service_role/secret key কখনো `app.js` বা GitHub-এ দেবেন না**।
- বাস্তব ব্যক্তিগত তথ্য নেওয়ার আগে গোপনীয়তা নীতি, সম্মতি, অ্যাক্সেস নীতি এবং ডেটা মুছে দেওয়ার পদ্ধতি ঠিক করুন।
- বর্তমান starter ডোনার তালিকায় ফোন নম্বর দেখায়। প্রকাশ্য ফোন নম্বর দেখানোর আগে ডোনারের স্পষ্ট সম্মতি নিশ্চিত করুন। আরও নিরাপদ production setup হলো ফোন নম্বর গোপন রেখে অ্যাডমিনের মাধ্যমে যোগাযোগ করানো।
- এটি চিকিৎসা-যোগ্যতা যাচাই করে না; রক্তদানের সিদ্ধান্ত হাসপাতাল/স্বাস্থ্যকর্মী নেবেন।
- free plan-এর সীমা, inactivity rules ও provider terms পরিবর্তন হতে পারে।

## ধাপ ১ — Supabase প্রজেক্ট
1. https://supabase.com/ এ অ্যাকাউন্ট খুলুন এবং New project তৈরি করুন।
2. Project name দিন `alokayon-blood-bank`; শক্তিশালী database password নিরাপদ জায়গায় রাখুন।
3. Dashboard → SQL Editor → New query খুলুন।
4. এই ফোল্ডারের `supabase-schema.sql` সম্পূর্ণ কপি করে Run করুন।
5. SQL run সফল হয়েছে কি না পরীক্ষা করুন।

## ধাপ ২ — নিজের অ্যাডমিন অ্যাকাউন্ট
1. Supabase Dashboard → Authentication → Users → Add user থেকে নিজের ইমেইল/পাসওয়ার্ড দিয়ে user তৈরি করুন।
2. ওই user-এর UUID কপি করুন।
3. SQL Editor-এ `YOUR-USER-UUID`-এর জায়গায় নিজের UUID বসিয়ে চালান:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = 'YOUR-USER-UUID';
```

4. Authentication settings-এ public sign-ups বন্ধ করুন। অ্যাডমিন লগইনের জন্য শুধু আপনার তৈরি করা user রাখুন।
5. পাসওয়ার্ড কাউকে দেবেন না এবং Supabase-এ MFA থাকলে চালু করুন।

## ধাপ ৩ — ওয়েবসাইটে Supabase সংযোগ
1. Supabase → Project Settings → API (কিছু ড্যাশবোর্ডে Connect/API Keys) খুলুন।
2. Project URL এবং publishable key (বা legacy anon public key) কপি করুন।
3. `app.js`-এর শুরুতে বসান:

```js
const SUPABASE_URL = "https://YOURPROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_PUBLIC_PUBLISHABLE_OR_ANON_KEY";
```

4. `service_role`, secret key বা database password এখানে বসাবেন না।
5. `index.html`-এ দুইটি `assets/` লোগো ইতোমধ্যে যোগ করা আছে। ফাইলগুলো বদলালে `assets/alokayon-blood-bank.png` এবং `assets/alokayon-foundation.png` নাম একই রাখুন।

## ধাপ ৪ — GitHub-এ আপলোড ও ফ্রি প্রকাশ
1. https://github.com/ এ অ্যাকাউন্ট খুলুন।
2. New repository তৈরি করুন, যেমন `alokayon-blood-bank`।
3. `index.html`, `styles.css`, `app.js`, `assets` ফোল্ডার এবং বাকি ফাইলগুলো repository-তে upload করুন।
4. Repository → Settings → Pages খুলুন।
5. Build and deployment-এ `Deploy from a branch` নির্বাচন করুন; branch `main`, folder `/ (root)` নির্বাচন করে Save করুন।
6. কয়েক মিনিট পরে Pages-এ দেখানো ঠিকানাটি খুলুন। সাধারণত `https://YOUR-USERNAME.github.io/alokayon-blood-bank/` ধরনের ঠিকানা হবে।
7. প্রতিটি আপডেটের পর নতুন commit/push বা upload করলে ওয়েবসাইট আপডেট হবে।

## ধাপ ৫ — টেস্ট
- প্রথমে ডেমো তথ্য দিয়ে টেস্ট করুন, বাস্তব রোগী/ডোনারের তথ্য নয়।
- রক্তদাতা নিবন্ধন করলে `donors` টেবিলে `approved=false` হিসেবে জমা হবে।
- অ্যাডমিন লগইন করে নিবন্ধন অনুমোদন করুন; অনুমোদিত ডোনার সার্চে দেখা যাবে।
- জরুরি অনুরোধ `blood_requests` টেবিলে জমা হবে এবং অ্যাডমিন প্যানেলে দেখা যাবে।
- অন্য browser/incognito session থেকে admin-only data পড়া বা পরিবর্তন করা যায় কি না পরীক্ষা করুন।
- phone privacy, duplicate registrations, spam prevention, request rate limiting ও backup policy production-এর আগে একজন developer দিয়ে যাচাই করান।

## বর্তমান সংস্করণের নোট
এই starter-এ ডোনার নিবন্ধন/অনুরোধ জমা, সার্চ, অ্যাডমিন লগইন, অনুমোদন ও অনুরোধ সম্পন্ন করার UI আছে। Public web form-এ CAPTCHA/rate limiting নেই; বাস্তব ব্যবহারের আগে যোগ করুন। Admin view ও Supabase RLS policies সঠিকভাবে পরীক্ষা না করে বাস্তব ব্যক্তিগত তথ্য ব্যবহার করবেন না।
