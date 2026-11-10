/* Trang làm phiếu: nhập mã cá nhân, điền phiếu, tự lưu nháp, gửi. */
"use strict";
const F={code:localStorage.getItem("dg-code")||"",name:"",rec:null,sent:false,at:"",preview:/[?&]xem-thu/.test(location.search)};
function dgMissing(r){ const m=[]; if(!r.sat) m.push("mức hài lòng"); if(!r.load) m.push("khối lượng việc");
  const na=DG_AREAS.filter(([k])=>r.areas[k].s.some(x=>!x)||!r.areas[k].want).length; if(na) m.push(na+" đầu việc chưa chấm đủ");
  const nc=DG_COMMON.filter(([k])=>!r.common[k]).length; if(nc) m.push(nc+" tiêu chí chung"); if(!r.lead.length) m.push("đầu việc muốn phụ trách chính"); return m; }
function dgTa(id,l,v,ph){ return '<div class="f"><label for="'+id+'">'+l+'</label><textarea id="'+id+'" data-dgt="'+id.slice(3)+'" rows="2" placeholder="'+esc(ph||"")+'">'+esc(v||"")+'</textarea></div>'; }

function vLogin(err){
  return '<div class="panel narrow"><h1>Phiếu tự đánh giá</h1><p class="sub">Nhập mã cá nhân anh Uy gửi riêng cho bạn qua Zalo.</p>'
   +'<form id="lgf" class="f" style="margin-top:12px"><label for="lgc">Mã cá nhân</label><input id="lgc" autocomplete="off" autocapitalize="none" spellcheck="false" value="'+esc(F.code)+'" placeholder="Ví dụ: ab3k9x"><button class="btn pri" style="margin-top:10px">Vào làm phiếu</button></form>'
   +(err?'<div class="alert bad" style="margin-top:10px">'+esc(err)+'</div>':'')
   +'<p class="sub" style="margin-top:12px"><a href="?xem-thu">Xem thử phiếu</a> (không lưu)</p></div>';
}
function vForm(){
  const r=F.rec, miss=dgMissing(r), pv=F.preview;
  let h=(pv?'<div class="alert" style="margin-bottom:10px">Bản xem thử. Không lưu. <a href="./danh-gia.html">Về trang nhập mã</a></div>':'')
   +'<div class="row between"><h1 style="margin:0">Phiếu tự đánh giá</h1>'+(pv?'':'<button class="btn sm" id="dgOut">Đổi người</button>')+'</div>'
   +'<div class="sub">'+(F.name?'<b>'+esc(F.name)+'</b> · ':'')+'Đợt tháng 11/2026. Phiếu giúp công ty giao việc đúng thế mạnh và biết bạn cần hỗ trợ gì. Không dùng để chấm thưởng phạt. Chỉ giám đốc xem được phiếu của bạn.</div>'
   +(F.sent?'<div class="alert" style="margin-top:8px">Bạn đã gửi phiếu'+(F.at?' ngày '+esc(dmy(F.at.slice(0,10))):'')+'. Vẫn sửa và gửi lại được.</div>':'');
  h+='<div class="panel dgsec"><h2>1. Công việc hiện tại</h2>'+dgTa("dg_now","Việc bạn đang làm nhiều nhất là gì?",r.now,"Ví dụ: đi xã, xuất hồ sơ, tập huấn…")
   +'<div class="f"><label>Bạn hài lòng với công việc hiện tại ở mức nào? (1 = chưa hài lòng, 5 = rất hài lòng)</label>'+dgSeg('data-dgsat',r.sat,5)+'</div>'
   +'<div class="f"><label>Khối lượng việc hiện nay</label>'+dgChips('data-dgload',DG_LOAD,r.load)+'</div>'
   +dgTa("dg_good","Việc bạn làm tốt nhất, thấy tự tin nhất",r.good)+dgTa("dg_hard","Việc bạn thấy khó, đang vướng",r.hard)+dgTa("dg_help","Bạn cần công ty hỗ trợ gì (đào tạo, thiết bị, công cụ, người kèm)?",r.help)+'</div>';
  h+='<div class="panel dgsec"><h2>2. Tự chấm năng lực theo 8 đầu việc</h2><div class="sub">Chấm đúng như bạn đang làm được, kể cả việc chưa từng làm. Không có câu trả lời sai.</div><ol class="dgscale">'+DG_SCALE.slice(1).map((t,i)=>'<li><b>'+(i+1)+'</b> '+t+'</li>').join("")+'</ol>'
   +DG_AREAS.map(([k,t,,cr],i)=>{ const x=r.areas[k], done=!x.s.some(v=>!v)&&x.want;
     return '<div class="dgarea'+(done?' ok':'')+'" data-area="'+k+'"><div class="dgah"><b>'+(i+1)+'. '+esc(t)+'</b><span class="pill good">Xong</span></div>'
      +cr.map((c,j)=>'<div class="dgcr"><span>'+esc(c)+'</span>'+dgSeg('data-dgs="'+k+':'+j+'"',x.s[j],5,DG_SCALE)+'</div>').join("")
      +'<div class="dgcr"><span>Bạn có muốn làm việc này?</span>'+dgChips('data-dgw="'+k+'"',DG_WANT,x.want)+'</div>'
      +'<input class="dgnote" data-dgn="'+k+'" placeholder="Ghi chú thêm (kinh nghiệm, ví dụ đã làm), không bắt buộc" value="'+esc(x.note)+'"></div>'; }).join("")+'</div>';
  h+='<div class="panel dgsec"><h2>3. Cách làm việc</h2>'+DG_COMMON.map(([k,t])=>'<div class="dgcr"><span>'+esc(t)+'</span>'+dgSeg('data-dgc="'+k+'"',r.common[k]||0,5,DG_SCALE)+'</div>').join("")+'</div>';
  const opt=DG_AREAS.map(a=>[a[0],a[2]]);
  h+='<div class="panel dgsec"><h2>4. Định hướng</h2><div class="f"><label>Đầu việc bạn muốn phụ trách chính (chọn tối đa 2)</label>'+dgChips('data-dglead',opt,r.lead,true)+'</div>'
   +'<div class="f"><label>Đầu việc bạn muốn hỗ trợ (tối đa 2)</label>'+dgChips('data-dgsup',opt,r.support,true)+'</div>'
   +dgTa("dg_learn","Trong 3 tháng tới bạn muốn học thêm gì?",r.learn)
   +'<div class="f"><label>Nếu trình bày trước đội, bạn chọn chủ đề nào? (chọn được nhiều)</label>'+dgChips('data-dgtop',DG_TOP,r.topics,true)+'</div>'
   +dgTa("dg_other","Góp ý khác cho công ty, cho cách phân việc",r.other)+'</div>';
  h+='<div class="dgfoot panel"><div class="sub" id="dgMiss">'+(miss.length?'Còn thiếu: '+esc(miss.join(", ")):'Đã điền đủ, có thể gửi.')+'</div><div class="row" style="gap:8px"><button class="btn" id="dgSave"'+(pv?" disabled":"")+'>Lưu nháp</button><button class="btn pri" id="dgSend"'+(pv?" disabled":"")+'>'+(F.sent?"Gửi lại":"Gửi phiếu")+'</button></div></div>';
  return h;
}
let dgT=null;
function dgDirty(){ if(F.preview) return; clearTimeout(dgT); dgT=setTimeout(()=>dgSave(false,true),2500); const m=dgMissing(F.rec), el=$("#dgMiss"); if(el) el.textContent=m.length?"Còn thiếu: "+m.join(", "):"Đã điền đủ, có thể gửi."; }
async function dgSave(submit,quiet){ clearTimeout(dgT); dgT=null; if(F.preview) return;
  if(submit){ const m=dgMissing(F.rec); if(m.length){ toast("Còn thiếu: "+m[0]); return; } }
  const b=$("#dgSend"); if(submit&&b) b.disabled=true;
  const r=await api({action:"save",code:F.code,rec:F.rec,submit:!!submit}); if(b) b.disabled=false;
  if(r.error){ toast("Chưa lưu được: "+r.error); return; }
  F.at=r.rec.updatedAt; if(submit){ F.sent=true; toast("Đã gửi phiếu. Cảm ơn bạn!"); render(); window.scrollTo(0,0); } else if(!quiet) toast("Đã lưu nháp"); }
function bindForm(A){
  const r=F.rec;
  $("#dgOut")?.addEventListener("click",()=>{ localStorage.removeItem("dg-code"); F.code=""; F.rec=null; render(); });
  const tog=(btn)=>{ btn.parentElement.querySelectorAll("button").forEach(b=>{ const on=b===btn; b.classList.toggle("on",on); b.setAttribute("aria-pressed",on); }); };
  const areaOk=k=>{ const x=r.areas[k]; A.querySelector('[data-area="'+k+'"]')?.classList.toggle("ok",!x.s.some(v=>!v)&&!!x.want); };
  A.querySelectorAll("[data-dgsat]").forEach(b=>b.addEventListener("click",()=>{ r.sat=+b.dataset.v; tog(b); dgDirty(); }));
  A.querySelectorAll("[data-dgload]").forEach(b=>b.addEventListener("click",()=>{ r.load=b.dataset.v; tog(b); dgDirty(); }));
  A.querySelectorAll("[data-dgs]").forEach(b=>b.addEventListener("click",()=>{ const [k,j]=b.dataset.dgs.split(":"); r.areas[k].s[+j]=+b.dataset.v; tog(b); areaOk(k); dgDirty(); }));
  A.querySelectorAll("[data-dgw]").forEach(b=>b.addEventListener("click",()=>{ r.areas[b.dataset.dgw].want=b.dataset.v; tog(b); areaOk(b.dataset.dgw); dgDirty(); }));
  A.querySelectorAll("[data-dgc]").forEach(b=>b.addEventListener("click",()=>{ r.common[b.dataset.dgc]=+b.dataset.v; tog(b); dgDirty(); }));
  const sync=()=>{ A.querySelectorAll("[data-dglead]").forEach(x=>x.classList.toggle("on",r.lead.includes(x.dataset.v))); A.querySelectorAll("[data-dgsup]").forEach(x=>x.classList.toggle("on",r.support.includes(x.dataset.v))); A.querySelectorAll("[data-dgtop]").forEach(x=>x.classList.toggle("on",r.topics.includes(x.dataset.v))); };
  const multi=(attr,field,max)=>A.querySelectorAll("["+attr+"]").forEach(b=>b.addEventListener("click",()=>{ const v=b.dataset.v, L=r[field], i=L.indexOf(v);
    if(i>=0) L.splice(i,1); else { if(max&&L.length>=max){ toast("Chọn tối đa "+max); return; } L.push(v); }
    if(field==="lead") r.support=r.support.filter(x=>!r.lead.includes(x)); if(field==="support") r.lead=r.lead.filter(x=>!r.support.includes(x)); sync(); dgDirty(); }));
  multi("data-dglead","lead",2); multi("data-dgsup","support",2); multi("data-dgtop","topics",0);
  A.querySelectorAll("[data-dgt]").forEach(t=>t.addEventListener("input",()=>{ r[t.dataset.dgt]=t.value.slice(0,1500); dgDirty(); }));
  A.querySelectorAll("[data-dgn]").forEach(t=>t.addEventListener("input",()=>{ r.areas[t.dataset.dgn].note=t.value.slice(0,300); dgDirty(); }));
  $("#dgSave")?.addEventListener("click",()=>dgSave(false));
  $("#dgSend")?.addEventListener("click",()=>dgSave(true));
}
async function login(code){
  const A=$("#app"); A.innerHTML='<div class="empty">Đang mở phiếu…</div>';
  const r=await api({action:"get",code});
  if(r.error){ A.innerHTML=vLogin(r.error); bindLogin(); return; }
  F.code=code; localStorage.setItem("dg-code",code); F.name=r.name||""; F.rec=dgFill(r.rec); F.sent=r.rec?.status==="sent"; F.at=r.rec?.updatedAt||""; render();
}
function bindLogin(){ $("#lgf")?.addEventListener("submit",e=>{ e.preventDefault(); const c=$("#lgc").value.trim().toLowerCase(); if(c) login(c); }); }
function render(){ const A=$("#app");
  if(F.preview){ if(!F.rec) F.rec=dgBlank(); A.innerHTML=vForm(); bindForm(A); return; }
  if(!F.rec){ A.innerHTML=vLogin(); bindLogin(); return; }
  A.innerHTML=vForm(); bindForm(A); }
window.addEventListener("beforeunload",e=>{ if(dgT){ e.preventDefault(); e.returnValue=""; } });
if(F.code&&!F.preview) login(F.code); else render();
