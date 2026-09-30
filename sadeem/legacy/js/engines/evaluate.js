/* SADEEM HANGAR · idea evaluation + SADEEM classification rules (pure, deterministic, offline). */
window.EVAL=(function(){
const A=(ar,en)=>({ar,en});
const KW={
 value:[/cost|ساع|درهم|كلفة|وقت|زمن|hour|save|توفير|downtime|توقف|throughput|إنتاج/i],
 feas:[/prototype|نموذج|test|تجربة|exist|موجود|supplier|مورد|off-the-shelf|جاهز/i],
 risk:[/safety|سلامة|explos|ammunition|ذخيرة|hazard|خطر|fire|حريق/i],
 fit:[/cooling|تبريد|dust|غبار|drone|درون|autonom|ذات|additive|طباعة|twin|توأم|weld|لحام|emirat|إماراتي|training|تدريب/i],
 clarity:[/because|لأن|so that|بحيث|instead|بدل|when|عندما/i],
};
const SENS=[/missile|صاروخ|warhead|رأس حربي|guidance|توجيه صاروخ|classified|سري|export control|ammunition|ذخيرة|encryption key|مفتاح تشفير|frequency plan|خطة ترددات|partner data|بيانات شريك/i];
function evaluate(text,ch){
  const t=String(text||"");const len=t.length;
  const hit=(arr)=>arr.some(r=>r.test(t));
  const s={
    clarity:Math.min(100,Math.round(20+Math.min(len,600)/600*55+(hit(KW.clarity)?25:0))),
    value:Math.min(100,45+(hit(KW.value)?35:0)+(ch?10:0)+(len>240?10:0)),
    feasibility:Math.min(100,50+(hit(KW.feas)?30:0)+(len>120?10:0)-(len>1200?10:0)),
    risk:hit(KW.risk)?68:28,
    fit:Math.min(100,40+(hit(KW.fit)?35:0)+(ch?25:0)),
  };
  const missing=[];
  if(!hit(KW.value))missing.push(A("لم يُذكر الأثر الكمي: كم ساعة أو درهماً أو توقفاً توفّر الفكرة؟","No quantified impact: how many hours, dirhams or stops does it save?"));
  if(!hit(KW.feas))missing.push(A("لم يُذكر كيف يمكن تجربتها بتكلفة منخفضة وفي مدة محددة.","No path to a low-cost, time-boxed test."));
  if(!ch)missing.push(A("لم تُربط باحتياج وطني معلن؛ الربط يرفع الأولوية.","Not linked to a declared national need; linking raises priority."));
  if(len<120)missing.push(A("الوصف قصير؛ أضف الملاحظة الأصلية ومن يتأثر بها.","The description is short; add the original observation and who is affected."));
  const total=Math.round(s.clarity*.2+s.value*.3+s.feasibility*.25+(100-s.risk)*.1+s.fit*.15);
  const verdict=total>=72?A("جاهزة للتقييم الوطني","Ready for national evaluation"):total>=55?A("تحتاج معلومات قبل التقييم","Needs information before evaluation"):A("تحتاج إعادة صياغة","Needs rework");
  return {s,total,missing,verdict};
}
function classify(text,answers){ // answers: {domain:0-2,dual:0-1,export:0-1,partner:0-1}
  const a=answers||{};let pts=(a.domain||0)*2+(a.dual||0)*2+(a.export||0)*3+(a.partner||0)*2;
  const kw=SENS.some(r=>r.test(String(text||"")));if(kw)pts+=3;
  const level=pts>=5?"high":pts>=3?"controlled":"open";
  const rule=level==="high"?A("قاعدة الاحتواء: مجال حساس + استخدام مزدوج أو ضوابط تصدير. تُحفَظ الفكرة في مجموعة مقيدة ولا تُرسل إلى أي نموذج خارجي، وتُوجَّه عبر المسار الوطني.","Containment rule: sensitive domain plus dual use or export controls. Stored in the restricted collection, never sent to an external model, guided through the national path."):
   level==="controlled"?A("قاعدة التوجيه: تُراجع داخلياً قبل النشر، وتبقى خارج البورصة والخلاصة.","Guidance rule: reviewed internally before publication, kept out of the exchange and the feed."):
   A("قاعدة الانفتاح: تدخل مسار الابتكار العادي.","Open rule: enters the normal innovation path.");
  return {level,pts,kw,rule};
}
return {evaluate,classify};
})();
