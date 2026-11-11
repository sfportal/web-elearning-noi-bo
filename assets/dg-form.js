/* Trang làm phiếu: nhập mã cá nhân, điền phiếu, tự lưu nháp, gửi. */
"use strict";
const F={pid:localStorage.getItem("dg-pid")||"",rec:null,sent:false,at:"",link:"",preview:/[?&]xem-thu/.test(location.search)};
const draftKey=()=>"dg-draft-"+F.pid;
function dgMissing(r){ const m=[]; if(!r.sat) m.push("mức hài lòng"); if(!r.load) m.push("khối lượng việc");
  const na=DG_AREAS.filter(([k])=>r.areas[k].s.some(x=>!x)||!r.areas[k].want).length; if(na) m.push(na+" đầu việc chưa chấm đủ");
  const nc=DG_COMP.filter(([k])=>!r.comp[k]).length; if(nc) m.push(nc+" năng lực chung"); const nb=dgBscK().filter(k=>!r.bsc[k]).length; if(nb) m.push(nb+" chỉ số BSC"); if(!r.lead.length) m.push("đầu việc muốn phụ trách chính"); return m; }
function dgTa(id,l,v,ph){ return '<div class="f"><label for="'+id+'">'+l+'</label><textarea id="'+id+'" data-dgt="'+id.slice(3)+'" rows="2" placeholder="'+esc(ph||"")+'">'+esc(v||"")+'</textarea></div>'; }

function vLogin(){
  return '<div class="panel narrow"><h1>Phiếu tự đánh giá</h1><p class="sub">Đợt tháng 11/2026. Chọn tên của bạn để bắt đầu. Phiếu tự lưu trên điện thoại của bạn, làm xong bấm Gửi để gửi cho anh Uy.</p>'
   +'<div class="grid" style="grid-template-columns:1fr 1fr;margin-top:12px">'+DG_STAFF.map(p=>'<button class="btn" data-who="'+p+'">'+esc(DG_NAME[p])+'</button>').join("")+'</div>'
   +'<p class="sub" style="margin-top:12px"><a href="?xem-thu">Xem thử phiếu</a> (không lưu)</p></div>';
}
function vDone(){
  return '<div class="panel narrow"><h1>Còn một bước: gửi cho anh Uy</h1><p class="sub">Phiếu của bạn đã nằm trong đường link dưới đây. Bấm nút để gửi qua Zalo (hoặc sao chép rồi dán vào tin nhắn Zalo cho anh Uy). Chưa gửi link thì anh Uy chưa nhận được phiếu.</p>'
   +'<div class="row" style="margin-top:12px"><button class="btn pri" id="dnShare">Gửi qua Zalo, tin nhắn</button><button class="btn" id="dnCopy">Sao chép link</button></div>'
   +'<textarea readonly id="dnLink" rows="3" style="width:100%;margin-top:10px;font-size:12px;border:1px solid var(--line);border-radius:8px;padding:8px;background:var(--surface)">'+esc(F.link)+'</textarea>'
   +'<p class="sub" style="margin-top:10px">Muốn sửa phiếu: <button class="btn sm" id="dnEdit">Sửa phiếu</button> rồi gửi lại link mới. Anh Uy sẽ lấy bản mới nhất.</p></div>';
}
function vForm(){
  const r=F.rec, miss=dgMissing(r), pv=F.preview;
  let h=(pv?'<div class="alert" style="margin-bottom:10px">Bản xem thử. Không lưu. <a href="./danh-gia.html">Về trang nhập mã</a></div>':'')
   +'<div class="row between"><h1 style="margin:0">Phiếu tự đánh giá</h1>'+(pv?'':'<button class="btn sm" id="dgOut">Đổi người</button>')+'</div>'
   +'<div class="sub">'+(F.pid?'<b>'+esc(DG_NAME[F.pid])+'</b> · ':'')+'Đợt tháng 11/2026. Phiếu giúp công ty giao việc đúng thế mạnh và biết bạn cần hỗ trợ gì. Không dùng để chấm thưởng phạt. Chỉ giám đốc xem phiếu của bạn.</div>'
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
  h+='<div class="panel dgsec"><h2>3. Năng lực chung</h2><div class="sub">Chấm theo việc bạn thường làm trong 3 tháng gần đây. Mỗi mức có mô tả hành vi, chọn mức gần đúng nhất (2, 4 là ở giữa).</div>'+DG_COMP.map(([k,t,d,an])=>'<div class="dgarea'+(r.comp[k]?' ok':'')+'" data-comp="'+k+'"><div class="dgah"><b>'+esc(t)+'</b><span class="pill good">Xong</span></div><div class="sub">'+esc(d)+'</div><ul class="dganc"><li><b>1</b> '+esc(an[0])+'</li><li><b>3</b> '+esc(an[1])+'</li><li><b>5</b> '+esc(an[2])+'</li></ul>'+dgSeg('data-dgc="'+k+'"',r.comp[k]||0,5)+'</div>').join("")
   +dgTa("dg_ex","Kể ngắn một việc khó gần đây bạn đã tự xử lý: vướng gì, bạn làm gì, kết quả ra sao (không bắt buộc)",r.ex)+'</div>';
  h+='<div class="panel dgsec"><h2>4. Kết quả công việc (thẻ điểm cân bằng)</h2><div class="sub">Chấm mức bạn đạt so với mục tiêu trong 3 tháng gần đây, theo 4 góc nhìn. Việc không thuộc phần bạn làm thì chọn "Không áp dụng". Không ghi số tiền, chỉ chấm mức đạt.</div><ol class="dgscale">'+DG_BSC_SCALE.slice(1).map((t,i)=>'<li><b>'+(i+1)+'</b> '+t+'</li>').join("")+'</ol>'
   +DG_BSC.map(([g,t,w,it])=>'<div class="dgarea'+(it.every(([k])=>r.bsc[k])?' ok':'')+'" data-bscg="'+g+'"><div class="dgah"><b>'+esc(t)+' <small class="sub">('+w+'%)</small></b><span class="pill good">Xong</span></div>'
     +it.map(([k,l])=>'<div class="dgcr"><span>'+esc(l)+'</span><div class="row" style="gap:4px">'+dgSeg('data-dgb="'+k+'"',r.bsc[k]||0,5,DG_BSC_SCALE)+'<button type="button" class="dgna'+(r.bsc[k]===-1?' on':'')+'" data-dgb="'+k+'" data-v="-1">Không áp dụng</button></div></div>').join("")
     +'<input class="dgnote" data-dggoal="'+g+'" placeholder="Mục tiêu của bạn cho 3 tháng tới ở mặt này (không bắt buộc)" value="'+esc(r.goal[g]||"")+'"></div>').join("")+'</div>';
  const opt=DG_AREAS.map(a=>[a[0],a[2]]);
  h+='<div class="panel dgsec"><h2>5. Định hướng</h2><div class="f"><label>Đầu việc bạn muốn phụ trách chính (chọn tối đa 2)</label>'+dgChips('data-dglead',opt,r.lead,true)+'</div>'
   +'<div class="f"><label>Đầu việc bạn muốn hỗ trợ (tối đa 2)</label>'+dgChips('data-dgsup',opt,r.support,true)+'</div>'
   +dgTa("dg_learn","Trong 3 tháng tới bạn muốn học thêm gì?",r.learn)
   +'<div class="f"><label>Nếu trình bày trước đội, bạn chọn chủ đề nào? (chọn được nhiều)</label>'+dgChips('data-dgtop',DG_TOP,r.topics,true)+'</div>'
   +dgTa("dg_other","Góp ý khác cho công ty, cho cách phân việc",r.other)+'</div>';
  h+='<div class="dgfoot panel"><div class="sub" id="dgMiss">'+(miss.length?'Còn thiếu: '+esc(miss.join(", ")):'Đã điền đủ, có thể gửi.')+'</div><div class="row" style="gap:8px"><button class="btn" id="dgSave"'+(pv?" disabled":"")+'>Lưu tạm</button><button class="btn pri" id="dgSend"'+(pv?" disabled":"")+'>'+(F.sent?"Gửi lại":"Gửi phiếu")+'</button></div></div>';
  return h;
}
let dgT=null;
function dgStore(){ if(F.preview||!F.pid) return; localStorage.setItem(draftKey(),JSON.stringify({rec:F.rec,sent:F.sent,at:F.at})); }
function dgDirty(){ if(F.preview) return; clearTimeout(dgT); dgT=setTimeout(dgStore,600); const m=dgMissing(F.rec), el=$("#dgMiss"); if(el) el.textContent=m.length?"Còn thiếu: "+m.join(", "):"Đã điền đủ, có thể gửi."; }
async function dgSave(submit){ clearTimeout(dgT); if(F.preview) return;
  if(submit){ const m=dgMissing(F.rec); if(m.length){ toast("Còn thiếu: "+m[0]); return; } }
  F.at=new Date().toISOString();
  if(submit){ F.sent=true; const code=await dgEncode({v:1,round:"2026-11",p:F.pid,at:F.at,r:F.rec}); F.link=new URL("ket-qua.html",location.href).href.split("#")[0]+"#r="+code; }
  dgStore(); if(submit){ render(); window.scrollTo(0,0); } else toast("Đã lưu trên máy này"); }
function bindForm(A){
  const r=F.rec;
  $("#dgOut")?.addEventListener("click",()=>{ dgStore(); localStorage.removeItem("dg-pid"); F.pid=""; F.rec=null; F.link=""; render(); });
  const tog=(btn)=>{ btn.parentElement.querySelectorAll("button").forEach(b=>{ const on=b===btn; b.classList.toggle("on",on); b.setAttribute("aria-pressed",on); }); };
  const areaOk=k=>{ const x=r.areas[k]; A.querySelector('[data-area="'+k+'"]')?.classList.toggle("ok",!x.s.some(v=>!v)&&!!x.want); };
  A.querySelectorAll("[data-dgsat]").forEach(b=>b.addEventListener("click",()=>{ r.sat=+b.dataset.v; tog(b); dgDirty(); }));
  A.querySelectorAll("[data-dgload]").forEach(b=>b.addEventListener("click",()=>{ r.load=b.dataset.v; tog(b); dgDirty(); }));
  A.querySelectorAll("[data-dgs]").forEach(b=>b.addEventListener("click",()=>{ const [k,j]=b.dataset.dgs.split(":"); r.areas[k].s[+j]=+b.dataset.v; tog(b); areaOk(k); dgDirty(); }));
  A.querySelectorAll("[data-dgw]").forEach(b=>b.addEventListener("click",()=>{ r.areas[b.dataset.dgw].want=b.dataset.v; tog(b); areaOk(b.dataset.dgw); dgDirty(); }));
  A.querySelectorAll("[data-dgc]").forEach(b=>b.addEventListener("click",()=>{ r.comp[b.dataset.dgc]=+b.dataset.v; tog(b); A.querySelector('[data-comp="'+b.dataset.dgc+'"]')?.classList.add("ok"); dgDirty(); }));
  A.querySelectorAll("[data-dgb]").forEach(b=>b.addEventListener("click",()=>{ const k=b.dataset.dgb; r.bsc[k]=+b.dataset.v; b.closest(".dgcr").querySelectorAll("button").forEach(x=>x.classList.toggle("on",x===b)); const g=DG_BSC.find(x=>x[3].some(i=>i[0]===k)); A.querySelector('[data-bscg="'+g[0]+'"]')?.classList.toggle("ok",g[3].every(([q])=>r.bsc[q])); dgDirty(); }));
  A.querySelectorAll("[data-dggoal]").forEach(t=>t.addEventListener("input",()=>{ r.goal[t.dataset.dggoal]=t.value.slice(0,300); dgDirty(); }));
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
function pickWho(p){ F.pid=p; localStorage.setItem("dg-pid",p); let d=null; try{ d=JSON.parse(localStorage.getItem(draftKey())||"null"); }catch(_){}
  F.rec=dgFill(d?.rec); F.sent=!!d?.sent; F.at=d?.at||""; F.link=""; render(); window.scrollTo(0,0); }
function bindDone(){ const share=async()=>{ const text="Phiếu tự đánh giá của "+DG_NAME[F.pid]+": "+F.link;
    if(navigator.share){ try{ await navigator.share({title:"Phiếu tự đánh giá",text:"Phiếu tự đánh giá của "+DG_NAME[F.pid],url:F.link}); return; }catch(e){ if(e.name==="AbortError") return; } }
    copy(); };
  const copy=async()=>{ try{ await navigator.clipboard.writeText(F.link); toast("Đã sao chép. Dán vào Zalo gửi anh Uy."); }catch(_){ const t=$("#dnLink"); t.select(); document.execCommand("copy"); toast("Đã sao chép"); } };
  $("#dnShare").addEventListener("click",share); $("#dnCopy").addEventListener("click",copy); $("#dnEdit").addEventListener("click",()=>{ F.link=""; render(); }); }
function render(){ const A=$("#app");
  if(F.preview){ if(!F.rec) F.rec=dgBlank(); A.innerHTML=vForm(); bindForm(A); return; }
  if(!F.pid){ A.innerHTML=vLogin(); A.querySelectorAll("[data-who]").forEach(b=>b.addEventListener("click",()=>pickWho(b.dataset.who))); return; }
  if(F.link){ A.innerHTML=vDone(); bindDone(); return; }
  A.innerHTML=vForm(); bindForm(A); }
if(F.pid&&!F.preview&&DG_STAFF.includes(F.pid)) pickWho(F.pid); else { F.pid=""; render(); }
