/*
  আলোকায়ন ব্লাড ব্যাংক — starter frontend
  1) Supabase project তৈরি করুন
  2) supabase-schema.sql চালান
  3) নিচে Project URL এবং publishable/anon key বসান
  4) Admin account Supabase Dashboard থেকে তৈরি করুন; public sign-up বন্ধ রাখুন
*/
const SUPABASE_URL = ""; // e.g. https://YOURPROJECT.supabase.co
const SUPABASE_ANON_KEY = ""; // Supabase publishable/anon key ONLY. Never put service_role key here.
const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase);
const db = supabaseReady ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const AREAS = [
  "আনোয়ারা","বাঁশখালী","বোয়ালখালী","চন্দনাইশ","ফটিকছড়ি","হাটহাজারী","কর্ণফুলী",
  "লোহাগাড়া","মীরসরাই","পটিয়া","রাঙ্গুনিয়া","রাউজান","সন্দ্বীপ","সাতকানিয়া",
  "সীতাকুণ্ড","চট্টগ্রাম মহানগর","ডবলমুরিং","পাঁচলাইশ","পাহাড়তলী","হালিশহর",
  "কোতোয়ালী","বায়েজিদ","চান্দগাঁও","বন্দর","খুলশী","ইপিজেড","আকবরশাহ"
];
const byId = id => document.getElementById(id);
function setMessage(id, text, type="") { const el=byId(id); el.textContent=text; el.className="message "+type; }
function fillAreas() {
  ["searchArea","registerArea","requestArea"].forEach(id => {
    const el=byId(id);
    AREAS.forEach(area => { const op=document.createElement("option"); op.value=area; op.textContent=area; el.appendChild(op); });
  });
}
fillAreas();

function needConfig(messageId) {
  if (!supabaseReady) {
    setMessage(messageId, "ওয়েবসাইটের ডেটাবেজ এখনো সংযুক্ত হয়নি। README-BN.md-এর Supabase সেটআপ শেষ করে app.js-এ Project URL ও publishable key বসান।", "error");
    return false;
  }
  return true;
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function telLink(phone) { return String(phone || "").replace(/[^\d+]/g, ""); }

byId("searchForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!needConfig("searchMessage")) return;
  const group=byId("searchBloodGroup").value, area=byId("searchArea").value;
  setMessage("searchMessage","খোঁজা হচ্ছে…");
  let query=db.from("public_donors").select("id,full_name,blood_group,area,locality,phone,last_donation_date").eq("approved",true).eq("available",true).limit(60);
  if(group) query=query.eq("blood_group",group);
  if(area) query=query.eq("area",area);
  const {data,error}=await query;
  if(error){setMessage("searchMessage","তথ্য আনা যায়নি। Supabase সেটআপ ও RLS policy যাচাই করুন।","error");return;}
  const results=byId("donorResults");
  results.replaceChildren();
  if(!data?.length){setMessage("searchMessage","এই ফিল্টারে কোনো অনুমোদিত ও বর্তমানে আগ্রহী রক্তদাতা পাওয়া যায়নি।");return;}
  setMessage("searchMessage",`মোট ${data.length} জন অনুমোদিত রক্তদাতা পাওয়া গেছে। ফোন নম্বর দেখানো হচ্ছে কেবল ডোনারের প্রকাশ্য যোগাযোগ-সম্মতি থাকলে।`,"success");
  data.forEach(d=>{
    const card=document.createElement("article");card.className="donor-card";
    card.innerHTML=`<span class="blood">${escapeHtml(d.blood_group)}</span><h3>${escapeHtml(d.full_name)}</h3><p>⌖ ${escapeHtml(d.area)}${d.locality ? " · "+escapeHtml(d.locality):""}</p><p>${d.last_donation_date ? "শেষ রক্তদান: "+escapeHtml(d.last_donation_date):"শেষ রক্তদানের তারিখ দেওয়া হয়নি"}</p><p>${d.phone ? "যোগাযোগ নম্বর: "+escapeHtml(d.phone):"যোগাযোগের জন্য অ্যাডমিনের সঙ্গে যোগাযোগ করুন"}</p>${d.phone?`<a class="btn btn-outline btn-small" href="tel:${escapeHtml(telLink(d.phone))}">কল করুন</a>`:""}`;
    results.appendChild(card);
  });
});

byId("registerForm").addEventListener("submit", async e=>{
  e.preventDefault(); if(!needConfig("registerMessage")) return;
  const f=new FormData(e.currentTarget);
  const payload={
    full_name:String(f.get("full_name")).trim(), blood_group:f.get("blood_group"),
    phone:String(f.get("phone")).trim(), area:f.get("area"),
    locality:String(f.get("locality")||"").trim()||null,
    last_donation_date:f.get("last_donation_date")||null,
    available:f.get("available")==="true", consent:true, approved:false
  };
  const {error}=await db.from("donors").insert(payload);
  if(error){setMessage("registerMessage","নিবন্ধন জমা হয়নি। ফোন নম্বর আগে দেওয়া আছে কি না বা ডেটাবেজ নীতি যাচাই করুন।","error");return;}
  e.currentTarget.reset();
  setMessage("registerMessage","ধন্যবাদ! আপনার নিবন্ধন জমা হয়েছে। যাচাই ও অনুমোদনের পর তালিকায় দেখানো হবে।","success");
});

byId("requestForm").addEventListener("submit", async e=>{
  e.preventDefault(); if(!needConfig("requestMessage")) return;
  const f=new FormData(e.currentTarget);
  const payload={
    requester_name:String(f.get("requester_name")).trim(),
    contact_phone:String(f.get("contact_phone")).trim(),
    blood_group:f.get("blood_group"), area:f.get("area"),
    needed_at:new Date(f.get("needed_at")).toISOString(),
    units:Number(f.get("units")), details:String(f.get("details")||"").trim()||null,
    status:"pending"
  };
  const {error}=await db.from("blood_requests").insert(payload);
  if(error){setMessage("requestMessage","অনুরোধ জমা হয়নি। পরে আবার চেষ্টা করুন বা সরাসরি প্রতিষ্ঠানের সঙ্গে যোগাযোগ করুন।","error");return;}
  e.currentTarget.reset();
  setMessage("requestMessage","আপনার অনুরোধ জমা হয়েছে। এটি যাচাই করে অ্যাডমিন যোগাযোগ করবেন। জরুরি চিকিৎসার ক্ষেত্রে হাসপাতাল/স্থানীয় জরুরি সেবার সঙ্গে সরাসরি যোগাযোগ করুন।","success");
});

const dialog=byId("adminDialog");
byId("adminOpen").addEventListener("click",()=>dialog.showModal());
byId("adminLoginForm").addEventListener("submit",async e=>{
  e.preventDefault(); if(!needConfig("adminMessage")) return;
  const f=new FormData(e.currentTarget);
  const {data,error}=await db.auth.signInWithPassword({email:f.get("email"),password:f.get("password")});
  if(error){setMessage("adminMessage","লগইন ব্যর্থ। ইমেইল/পাসওয়ার্ড যাচাই করুন।","error");return;}
  setMessage("adminMessage","লগইন হয়েছে।","success");
  byId("adminPanel").hidden=false;
  await loadAdmin();
});
async function loadAdmin(){
  const {data:donors,error:dErr}=await db.from("donors").select("id,full_name,blood_group,phone,area,created_at").eq("approved",false).order("created_at",{ascending:false}).limit(100);
  const holder=byId("pendingDonors"); holder.replaceChildren();
  if(dErr){holder.innerHTML='<p class="empty">ডোনার তালিকা লোড হয়নি। Admin RLS policy পরীক্ষা করুন।</p>';}
  else if(!donors?.length){holder.innerHTML='<p class="empty">পর্যালোচনার জন্য নতুন নিবন্ধন নেই।</p>';}
  else donors.forEach(d=>{
    const item=document.createElement("div");item.className="admin-item";
    item.innerHTML=`<strong>${escapeHtml(d.full_name)} · ${escapeHtml(d.blood_group)}</strong><p>${escapeHtml(d.area)} · ${escapeHtml(d.phone)}</p><button class="btn btn-primary btn-small" data-approve="${escapeHtml(d.id)}">অনুমোদন</button><button class="btn btn-outline btn-small" data-reject="${escapeHtml(d.id)}">মুছুন</button>`;
    holder.appendChild(item);
  });
  const {data:requests,error:rErr}=await db.from("blood_requests").select("id,requester_name,contact_phone,blood_group,area,needed_at,units,status,created_at").order("created_at",{ascending:false}).limit(50);
  const reqHolder=byId("adminRequests"); reqHolder.replaceChildren();
  if(rErr){reqHolder.innerHTML='<p class="empty">অনুরোধ লোড হয়নি। Admin RLS policy পরীক্ষা করুন।</p>';}
  else if(!requests?.length){reqHolder.innerHTML='<p class="empty">কোনো অনুরোধ নেই।</p>';}
  else requests.forEach(r=>{
    const item=document.createElement("div");item.className="admin-item";
    item.innerHTML=`<strong>${escapeHtml(r.blood_group)} · ${escapeHtml(r.area)} · ${escapeHtml(r.units)} ব্যাগ</strong><p>${escapeHtml(r.requester_name)} · ${escapeHtml(r.contact_phone)}</p><p>সময়: ${escapeHtml(new Date(r.needed_at).toLocaleString("bn-BD"))} · অবস্থা: ${escapeHtml(r.status)}</p><button class="btn btn-outline btn-small" data-close-request="${escapeHtml(r.id)}">সম্পন্ন হিসেবে চিহ্নিত</button>`;
    reqHolder.appendChild(item);
  });
}
byId("adminPanel").addEventListener("click",async e=>{
  if(!db)return;
  const approve=e.target.closest("[data-approve]"), reject=e.target.closest("[data-reject]"), close=e.target.closest("[data-close-request]");
  if(approve){const {error}=await db.from("donors").update({approved:true}).eq("id",approve.dataset.approve);if(error)alert("অনুমোদন হয়নি। Policy পরীক্ষা করুন।");else await loadAdmin();}
  if(reject){if(confirm("এই নিবন্ধনটি স্থায়ীভাবে মুছবেন?")){const {error}=await db.from("donors").delete().eq("id",reject.dataset.reject);if(error)alert("মুছতে পারেনি।");else await loadAdmin();}}
  if(close){const {error}=await db.from("blood_requests").update({status:"completed"}).eq("id",close.dataset.closeRequest);if(error)alert("আপডেট হয়নি।");else await loadAdmin();}
});
byId("adminLogout").addEventListener("click",async()=>{await db?.auth.signOut();byId("adminPanel").hidden=true;setMessage("adminMessage","লগআউট হয়েছে।");});
