/* Trang kết quả cho quản lý: ma trận, đánh giá sơ bộ, từng người, chấm và nhận xét. */
"use strict";
const PIN_SHA="b51d6983f5f71d2578ca5f5a522b65fcec63476ca75b69778345ca5746b24343";
const DGA={data:null,open:"",tab:"tong",ok:sessionStorage.getItem("dg-ok")==="1"};
// Dữ liệu chỉ nằm trong trình duyệt của máy này (localStorage). Sao lưu bằng nút Tải bản sao lưu.
function loadStore(){ let r={},n={}; try{ r=JSON.parse(localStorage.getItem("dg-recs")||"{}"); n=JSON.parse(localStorage.getItem("dg-notes")||"{}"); }catch(_){} DGA.data={recs:r,notes:n}; }
function saveStore(){ localStorage.setItem("dg-recs",JSON.stringify(DGA.data.recs)); localStorage.setItem("dg-notes",JSON.stringify(DGA.data.notes)); }
async function addCodes(text){ const codes=[...String(text).matchAll(/[#&?]r=([jz][A-Za-z0-9_-]{10,})/g)].map(m=>m[1]); let added=[],bad=0;
  for(const c of codes){ try{ const o=await dgDecode(c); if(!DG_STAFF.includes(o.p)||!o.r){ bad++; continue; } const old=DGA.data.recs[o.p];
      if(old&&(old.updatedAt||"")>(o.at||"")){ added.push(DG_NAME[o.p]+" (bản cũ hơn, bỏ qua)"); continue; }
      DGA.data.recs[o.p]={...dgFill(o.r),status:"sent",submittedAt:o.at,updatedAt:o.at}; added.push(DG_NAME[o.p]); }catch(_){ bad++; } }
  saveStore(); return {added,bad,n:codes.length}; }
const dm=s=>s?s.slice(8,10)+"/"+s.slice(5,7):"";
/* Đánh giá sơ bộ: điểm phù hợp mỗi đầu việc = 45% kỹ năng đầu việc (tự chấm, gộp điểm của anh nếu có)
   + 25% năng lực chung mà đầu việc cần (DG_REQ) + 30% mức muốn làm, cộng 0,3 nếu người đó chọn phụ trách chính. */
function dgSelf(rec,k){ return dgAvg(rec?.areas?.[k]?.s); }
const blend=(s,o)=>s&&o?(s+o)/2:(o||s);
function dgCap(rec,note,k){ return blend(dgSelf(rec,k),note?.sco?.[k]||0); }
function dgComp(rec,note,k){ return blend(rec?.comp?.[k]||0,note?.sco?.[k]||0); }
function dgReq(rec,note,a){ return dgAvg((DG_REQ[a]||[]).map(k=>dgComp(rec,note,k))); }
function dgFit(rec,note,k){ if(!rec) return 0; const c=dgCap(rec,note,k); if(!c) return 0; const q=dgReq(rec,note,k)||c, w=DG_WV[rec.areas?.[k]?.want]||3;
  return Math.min(5,0.45*c+0.25*q+0.3*w+((rec.lead||[]).includes(k)?0.3:0)); }
function dgSuit(rec,note){ if(!rec) return {fit:[],no:[]};
  const rows=DG_AREAS.map(([k,,sh])=>({k,sh,f:dgFit(rec,note,k),c:dgCap(rec,note,k),w:rec.areas?.[k]?.want,weak:(DG_REQ[k]||[]).filter(x=>{ const v=dgComp(rec,note,x); return v&&v<3; })})).filter(r=>r.f);
  const fit=rows.filter(r=>r.f>=3.6&&r.w!=="no"&&r.c>=3).sort((a,b)=>b.f-a.f).slice(0,3).map(r=>[r.sh,"Kỹ năng "+dgF(r.c)+(r.w==="yes"?", rất muốn làm":"")+(r.weak.length?"; cần bù: "+r.weak.map(dgCompName).join(", "):"")]);
  const no=rows.filter(r=>r.w==="no"||r.c<2.5||r.weak.length>=2).sort((a,b)=>a.f-b.f).slice(0,3).map(r=>[r.sh,[r.w==="no"?"không muốn làm":"",r.c<2.5?"kỹ năng "+dgF(r.c):"",r.weak.length?"thiếu "+r.weak.map(dgCompName).join(", "):""].filter(Boolean).join("; ")]);
  return {fit,no}; }
function dgRole(pid,k){ const p=DG_PLAN[k]||{}; return p.c===pid?"C":p.p===pid?"P":(p.cand||[]).includes(pid)?"U":""; }
function dgFlags(pid,rec,note){ const f=[]; if(!rec) return f;
  if(rec.load==="over") f.push(["bad","Thấy quá tải"]); else if(rec.load==="high") f.push(["warn","Thấy hơi nhiều việc"]); else if(rec.load==="low") f.push(["","Còn ít việc, nhận thêm được"]);
  if(rec.sat&&rec.sat<=2) f.push(["bad","Chưa hài lòng công việc hiện tại ("+rec.sat+"/5)"]);
  DG_AREAS.forEach(([k,,sh])=>{ const role=dgRole(pid,k), cap=dgCap(rec,note,k), w=rec.areas?.[k]?.want;
    if(role==="C"&&cap&&cap<3) f.push(["warn","Vai chính "+sh+" tự chấm "+dgF(cap)+": cần người kèm, đào tạo"]);
    if((role==="C"||role==="P")&&w==="no") f.push(["bad","Không muốn làm "+sh+" (đang được đề xuất "+(role==="C"?"vai chính":"vai phụ")+")"]);
    if((rec.lead||[]).includes(k)&&!role) f.push(["","Muốn phụ trách "+sh+", chưa có trong đề xuất"]);
    if(!role&&cap>=4&&w==="yes"&&!(rec.lead||[]).includes(k)) f.push(["","Mạnh và muốn làm "+sh+", đang chưa được giao"]); });
  const lo=DG_COMP.filter(([k])=>{ const v=dgComp(rec,note,k); return v&&v<=2; }).map(c=>c[1]); if(lo.length) f.push(["warn","Năng lực chung cần phát triển: "+lo.join(", ")]);
  const all=DG_AREAS.flatMap(([k])=>rec.areas?.[k]?.s||[]).filter(x=>x>0); if(all.length>=20&&dgAvg(all)>=4.5) f.push(["warn","Tự chấm gần như toàn 4–5: nên đối chiếu với kết quả thực tế"]);
  return f; }
function vDgAdmin(){
  if(DGA.data===null) return '<div class="empty">Đang tải kết quả…</div>';
  if(DGA.data.err) return '<div class="panel alert bad">Không tải được kết quả: '+esc(DGA.data.err)+'</div>';
  const R=DGA.data.recs||{}, N=DGA.data.notes||{}, ppl=DG_STAFF;
  const sent=ppl.filter(p=>R[p]?.status==="sent").length, draft=ppl.filter(p=>R[p]&&R[p].status!=="sent").length;
  let h='<div class="row between" style="gap:8px;align-items:flex-end;flex-wrap:wrap"><div><h1 style="margin:0">Tự đánh giá nhân sự</h1><div class="sub">Đợt 11/2026 · Nhân sự làm phiếu rồi gửi link qua Zalo. Anh mở link trên máy này (hoặc dán vào ô dưới) để thêm phiếu. Dữ liệu chỉ lưu trong trình duyệt máy này.</div></div><div class="row" style="gap:6px"><a class="btn" href="./danh-gia.html?xem-thu" target="_blank">Xem phiếu mẫu</a><button class="btn" id="dgBak">Tải bản sao lưu</button><label class="btn">Mở bản sao lưu<input type="file" id="dgImp" accept=".json,application/json" hidden></label><button class="btn" id="dgOut">Khóa</button></div></div>';
  h+='<div class="grid kpis" style="margin-top:12px"><div class="tile '+(sent===ppl.length?"good":"")+'"><span class="v">'+sent+'/'+ppl.length+'</span><span class="l">Đã nhận phiếu</span></div><div class="tile"><span class="v">'+(ppl.length-sent)+'</span><span class="l">Chưa nhận: '+esc(ppl.filter(p=>!R[p]).map(p=>DG_NAME[p].replace(/^(Anh|Chị)\s+/,"")).join(", ")||"không còn ai")+'</span></div></div>';
  h+='<div class="panel" style="margin-top:12px"><div class="f"><label for="dgPaste">Dán link phiếu nhân sự gửi qua Zalo (dán được nhiều link cùng lúc)</label><textarea id="dgPaste" rows="2" placeholder="https://…/ket-qua.html#r=…"></textarea></div><button class="btn pri" id="dgAdd" style="margin-top:8px">Thêm phiếu</button></div>';
  const tabs=[["tong","Ma trận"],["nl","Năng lực chung"],["so-bo","Đánh giá sơ bộ"],["nguoi","Từng người"]];
  h+='<div class="dgchips" style="margin:12px 0">'+tabs.map(([k,l])=>'<button type="button" data-dgtab="'+k+'"'+(DGA.tab===k?' class="on"':'')+'>'+l+'</button>').join("")+'</div>';
  const short=p=>esc((DG_NAME[p]||p).replace(/^(Anh|Chị)\s+/,""));
  if(DGA.tab==="tong"){
    h+='<div class="panel"><div class="sub" style="margin-bottom:6px">Ô là điểm năng lực trung bình 3 tiêu chí (1–5), đã gộp điểm của anh nếu có. ★ rất muốn làm, ✕ không muốn. Viền đậm: vai chính đề xuất ở bước 1, viền nhạt: vai phụ.</div><table class="dgmx"><thead><tr><th></th>'+ppl.map(p=>'<th>'+short(p)+'</th>').join("")+'</tr></thead><tbody>'
     +DG_AREAS.map(([k,,sh])=>'<tr><th>'+esc(sh)+'</th>'+ppl.map(p=>{ const rec=R[p], c=dgCap(rec,N[p],k), w=rec?.areas?.[k]?.want, role=dgRole(p,k);
       return '<td class="'+(role==="C"?"rc ":role==="P"?"rp ":"")+'" style="background:'+(c?'color-mix(in srgb,var(--brand) '+Math.round((c-1)/4*55+5)+'%,transparent)':'transparent')+'">'+(c?dgF(c):'<span class="sub">–</span>')+(w==="yes"?'<i>★</i>':w==="no"?'<i>✕</i>':'')+'</td>'; }).join("")+'</tr>').join("")
     +'<tr><th>Hài lòng</th>'+ppl.map(p=>'<td>'+(R[p]?.sat||'<span class="sub">–</span>')+'</td>').join("")+'</tr><tr><th>Khối lượng</th>'+ppl.map(p=>{ const l=R[p]?.load; return '<td style="font-size:11px'+(l==="over"?';color:var(--bad);font-weight:600':l==="high"?';color:var(--warn)':'')+'">'+(l?esc((DG_LOAD.find(x=>x[0]===l)||[,""])[1]):'–')+'</td>'; }).join("")+'</tr>'
     +'<tr><th>Trạng thái</th>'+ppl.map(p=>'<td style="font-size:11px">'+(R[p]?.status==="sent"?'<span style="color:var(--good)">Đã nhận</span>':'<span class="sub">Chưa</span>')+'</td>').join("")+'</tr></tbody></table></div>';
  } else if(DGA.tab==="nl"){
    h+='<div class="panel"><div class="sub" style="margin-bottom:6px">Điểm năng lực chung 1–5 (tự chấm, gộp điểm của anh nếu có). Thang theo hành vi: 1 chưa có, 3 làm được ổn định, 5 làm mẫu cho người khác.</div><table class="dgmx"><thead><tr><th></th>'+ppl.map(p=>'<th>'+short(p)+'</th>').join("")+'</tr></thead><tbody>'
     +DG_COMP.map(([k,t])=>'<tr><th>'+esc(t)+'</th>'+ppl.map(p=>{ const v=dgComp(R[p],N[p],k); return '<td style="background:'+(v?'color-mix(in srgb,var(--brand) '+Math.round((v-1)/4*55+5)+'%,transparent)':'transparent')+(v&&v<=2?';color:var(--bad);font-weight:600':'')+'">'+(v?dgF(v):'<span class="sub">–</span>')+'</td>'; }).join("")+'</tr>').join("")+'</tbody></table></div>'
     +'<div class="panel" style="margin-top:10px"><b>Năng lực chung mỗi đầu việc cần</b>'+DG_AREAS.map(([k,t])=>'<div class="sub" style="margin-top:4px"><b style="color:var(--ink)">'+esc(t)+':</b> '+(DG_REQ[k]||[]).map(dgCompName).join(", ")+'</div>').join("")+'</div>';
  } else if(DGA.tab==="so-bo"){
    const any=ppl.some(p=>R[p]);
    h+='<div class="panel"><div class="sub">Điểm phù hợp = 45% kỹ năng đầu việc (tự chấm, gộp điểm của anh nếu có) + 25% năng lực chung mà đầu việc cần + 30% mức muốn làm, cộng 0,3 nếu người đó chọn phụ trách chính. Đây là gợi ý để anh xem cùng buổi thuyết trình, không thay quyết định của anh.</div></div>';
    if(!any) h+='<div class="empty" style="margin-top:10px">Chưa có phiếu nào. Đánh giá sơ bộ hiện khi nhân sự bắt đầu làm phiếu.</div>';
    else { h+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin-top:10px">'+DG_AREAS.map(([k,t])=>{ const pl=DG_PLAN[k], rk=ppl.filter(p=>R[p]).map(p=>[p,dgFit(R[p],N[p],k)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
        const top=rk[0], planC=pl.c, agree=top&&planC&&top[0]===planC;
        let v=''; if(!rk.length) v='<span class="sub">Chưa đủ dữ liệu</span>';
        else if(planC) v=agree?'<span class="pill good">Khớp đề xuất</span>':'<span class="pill warn">Khác đề xuất: '+short(planC)+' → cân nhắc '+short(top[0])+'</span>';
        else v='<span class="pill">Gợi ý vai chính: '+short(top[0])+'</span>';
        return '<div class="panel"><b>'+esc(t)+'</b><div style="margin:6px 0">'+v+'</div>'+rk.slice(0,4).map(([p,s],i)=>'<div class="dgbar"><span>'+short(p)+(dgRole(p,k)?' <small class="sub">('+({C:"chính",P:"phụ",U:"ứng viên"})[dgRole(p,k)]+')</small>':'')+'</span><span class="dgtr"><b style="width:'+Math.round(s/5*100)+'%'+(i?';opacity:.55':'')+'"></b></span><span>'+dgF(s)+'</span></div>').join("")+'</div>'; }).join("")+'</div>';
      const fl=ppl.map(p=>[p,dgFlags(p,R[p],N[p])]).filter(x=>x[1].length);
      if(fl.length) h+='<div class="panel" style="margin-top:10px"><h2 style="margin-top:0">Điểm cần anh lưu ý</h2>'+fl.map(([p,f])=>'<div style="margin:6px 0"><b>'+esc(DG_NAME[p])+'</b><ul style="margin:4px 0 0;padding-left:18px">'+f.map(([c,t])=>'<li'+(c?' style="color:var(--'+c+')"':'')+'>'+esc(t)+'</li>').join("")+'</ul></div>').join("")+'</div>'; }
  } else {
    h+=ppl.map(p=>{ const rec=R[p], n=N[p]||{sco:{}}, op=DGA.open===p;
      const top=rec?DG_AREAS.map(([k,,sh])=>[sh,dgCap(rec,n,k)]).filter(x=>x[1]).sort((a,b)=>b[1]-a[1]):[];
      let c='<div class="panel" style="margin-bottom:10px"><button class="dgph" data-dgopen="'+p+'"><b>'+esc(DG_NAME[p])+'</b><span class="sub">'+(rec?(rec.status==="sent"?"Gửi ngày "+dm((rec.submittedAt||"").slice(0,10)):""):"Chưa nhận phiếu")+(top.length?' · Mạnh: '+top.slice(0,2).map(x=>esc(x[0])).join(", "):'')+'</span><span>'+(op?"▲":"▼")+'</span></button>';
      if(!op) return c+'</div>';
      if(rec){ const L=x=>(x||[]).map(k=>esc((DG_AREAS.find(a=>a[0]===k)||[,,k])[2])).join(", ")||"–";
        c+='<div class="dgkv"><span>Hài lòng</span><b>'+(rec.sat||"–")+'/5</b><span>Khối lượng</span><b>'+esc((DG_LOAD.find(x=>x[0]===rec.load)||[,"–"])[1])+'</b><span>Muốn phụ trách chính</span><b>'+L(rec.lead)+'</b><span>Muốn hỗ trợ</span><b>'+L(rec.support)+'</b><span>Chủ đề thuyết trình</span><b>'+((rec.topics||[]).map(t=>esc((DG_TOP.find(x=>x[0]===t)||[,t])[1])).join(", ")||"–")+'</b></div>'
         +[["now","Đang làm nhiều nhất"],["good","Làm tốt nhất"],["hard","Khó, đang vướng"],["help","Cần hỗ trợ"],["ex","Ví dụ tự giải quyết việc khó"],["learn","Muốn học thêm"],["other","Góp ý"]].filter(([k])=>rec[k]).map(([k,l])=>'<div style="margin-top:8px"><div class="sub">'+l+'</div><div style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(rec[k])+'</div></div>').join("");
        const su=dgSuit(rec,n), hi=DG_COMP.filter(([k])=>dgComp(rec,n,k)>=4).map(c=>c[1]), lo=DG_COMP.filter(([k])=>{ const v=dgComp(rec,n,k); return v&&v<=2; }).map(c=>c[1]);
        c+='<div class="dgsuit"><div><b style="color:var(--good)">Phù hợp</b>'+(su.fit.length?'<ul>'+su.fit.map(([a,r])=>'<li><b>'+esc(a)+'</b>: '+esc(r)+'</li>').join("")+'</ul>':'<div class="sub">Chưa rõ, cần thêm dữ liệu</div>')+'</div><div><b style="color:var(--bad)">Chưa phù hợp</b>'+(su.no.length?'<ul>'+su.no.map(([a,r])=>'<li><b>'+esc(a)+'</b>: '+esc(r)+'</li>').join("")+'</ul>':'<div class="sub">Không có đầu việc nào rõ là chưa phù hợp</div>')+'</div></div>'
         +'<div class="dgkv"><span>Năng lực mạnh</span><b>'+(esc(hi.join(", "))||"–")+'</b><span>Cần phát triển</span><b>'+(esc(lo.join(", "))||"–")+'</b></div>';
        const fl=dgFlags(p,rec,n); if(fl.length) c+='<ul style="margin:8px 0 0;padding-left:18px">'+fl.map(([cl,t])=>'<li'+(cl?' style="color:var(--'+cl+')"':'')+'>'+esc(t)+'</li>').join("")+'</ul>'; }
      else c+='<div class="sub" style="margin-top:6px">Chưa nhận phiếu của người này. Anh vẫn chấm trước được.</div>';
      c+='<h3 style="margin:12px 0 4px">Chấm của anh và đối chiếu</h3><div class="sub">Tự chấm là trung bình 3 tiêu chí. Ô của anh để trống thì chỉ dùng điểm tự chấm.</div>'
       +DG_AREAS.map(([k,t,sh])=>{ const s=rec?dgSelf(rec,k):0, w=rec?.areas?.[k]?.want, role=dgRole(p,k);
         return '<div class="dgcr"><span><b>'+esc(sh)+'</b>'+(role?' <small class="sub">('+({C:"đề xuất chính",P:"đề xuất phụ",U:"ứng viên"})[role]+')</small>':'')+'<br><small class="sub">Tự chấm '+(rec?.areas?.[k]?.s||[]).map(x=>x||"–").join(" · ")+' → '+dgF(s)+(w?' · '+esc((DG_WANT.find(x=>x[0]===w)||[,""])[1]):'')+'</small>'+(rec?.areas?.[k]?.note?'<br><small style="overflow-wrap:anywhere">'+esc(rec.areas[k].note)+'</small>':'')+'</span>'+dgSeg('data-dgo="'+p+':'+k+'"',n.sco?.[k]||0,5,DG_SCALE)+'</div>'; }).join("")
       +'<h3 style="margin:12px 0 4px">Năng lực chung</h3>'+DG_COMP.map(([k,t])=>'<div class="dgcr"><span><b>'+esc(t)+'</b><br><small class="sub">Tự chấm '+(rec?.comp?.[k]||"–")+'</small></span>'+dgSeg('data-dgo="'+p+':'+k+'"',n.sco?.[k]||0,5)+'</div>').join("")
       +'<div class="f" style="margin-top:8px"><label for="dgon_'+p+'">Nhận xét của anh (chỉ anh thấy)</label><textarea id="dgon_'+p+'" data-dgot="'+p+'" rows="3">'+esc(n.text||"")+'</textarea></div><div style="margin-top:8px"><button class="btn pri" data-dgosave="'+p+'">Lưu chấm, nhận xét</button></div></div>';
      return c; }).join("");
  }
  return h;
}
function vKey(err){ return '<div class="panel narrow"><h1>Kết quả tự đánh giá</h1><p class="sub">Trang dành cho giám đốc. Nhập mã PIN.</p><form id="kf" class="f" style="margin-top:12px"><label for="kc">Mã PIN</label><input id="kc" type="password" autocomplete="current-password"><button class="btn pri" style="margin-top:10px">Mở</button></form>'+(err?'<div class="alert bad" style="margin-top:10px">'+esc(err)+'</div>':'')+(location.hash.includes("r=")?'<p class="sub" style="margin-top:10px">Có một phiếu trong link này. Nhập PIN để thêm phiếu.</p>':'')+'</div>'; }
async function sha(t){ const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(t)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join(""); }
async function unlock(){ DGA.ok=true; sessionStorage.setItem("dg-ok","1"); loadStore();
  if(location.hash.includes("r=")){ const r=await addCodes(location.hash); history.replaceState(null,"",location.pathname+location.search); if(r.added.length) toast("Đã thêm phiếu: "+r.added.join(", ")); else if(r.bad) toast("Link phiếu bị lỗi, nhờ nhân sự gửi lại"); }
  render(); }
function bindKey(){ $("#kf")?.addEventListener("submit",async e=>{ e.preventDefault(); const v=$("#kc").value.trim(); if(await sha(v)===PIN_SHA) unlock(); else { $("#app").innerHTML=vKey("Mã PIN không đúng"); bindKey(); } }); }
function render(){ const A=$("#app"); if(!DGA.ok){ A.innerHTML=vKey(); bindKey(); return; } if(!DGA.data) loadStore(); A.innerHTML=vDgAdmin(); bindAdmin(A); }
function bindAdmin(A){
  A.querySelectorAll("[data-dgtab]").forEach(b=>b.addEventListener("click",()=>{ DGA.tab=b.dataset.dgtab; render(); }));
  $("#dgOut")?.addEventListener("click",()=>{ sessionStorage.removeItem("dg-ok"); DGA.ok=false; render(); });
  $("#dgAdd")?.addEventListener("click",async()=>{ const r=await addCodes($("#dgPaste").value); if(!r.n){ toast("Không thấy link phiếu nào"); return; } toast((r.added.length?"Đã thêm: "+r.added.join(", "):"Không thêm được")+(r.bad?" · "+r.bad+" link lỗi":"")); render(); });
  $("#dgBak")?.addEventListener("click",()=>{ const blob=new Blob([JSON.stringify({round:"2026-11",...DGA.data},null,1)],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="danh-gia-nhan-su-"+new Date().toISOString().slice(0,10)+".json"; a.click(); });
  $("#dgImp")?.addEventListener("change",async e=>{ const f=e.target.files[0]; if(!f) return; try{ const o=JSON.parse(await f.text()); Object.entries(o.recs||{}).forEach(([p,r])=>{ if(DG_STAFF.includes(p)&&(!DGA.data.recs[p]||(DGA.data.recs[p].updatedAt||"")<=(r.updatedAt||""))) DGA.data.recs[p]=r; }); Object.entries(o.notes||{}).forEach(([p,n])=>{ if(DG_STAFF.includes(p)) DGA.data.notes[p]=n; }); saveStore(); toast("Đã mở bản sao lưu"); render(); }catch(_){ toast("File không đúng"); } });
  A.querySelectorAll("[data-dgopen]").forEach(b=>b.addEventListener("click",()=>{ DGA.open=DGA.open===b.dataset.dgopen?"":b.dataset.dgopen; render(); }));
  const N=DGA.data.notes, get=p=>N[p]||(N[p]={sco:{},text:""});
  A.querySelectorAll("[data-dgo]").forEach(b=>b.addEventListener("click",()=>{ const [p,k]=b.dataset.dgo.split(":"), n=get(p); n.sco=n.sco||{}; const v=+b.dataset.v; n.sco[k]=n.sco[k]===v?0:v; b.parentElement.querySelectorAll("button").forEach(x=>x.classList.toggle("on",+x.dataset.v===n.sco[k])); }));
  A.querySelectorAll("[data-dgot]").forEach(t=>t.addEventListener("input",()=>{ get(t.dataset.dgot).text=t.value.slice(0,3000); }));
  A.querySelectorAll("[data-dgosave]").forEach(b=>b.addEventListener("click",()=>{ const p=b.dataset.dgosave; get(p).updatedAt=new Date().toISOString(); saveStore(); toast("Đã lưu trên máy này"); render(); }));
}
window.addEventListener("hashchange",()=>{ if(DGA.ok&&location.hash.includes("r=")) unlock(); });
if(DGA.ok) unlock(); else render();
