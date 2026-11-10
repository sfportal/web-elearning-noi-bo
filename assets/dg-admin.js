/* Trang kết quả cho quản lý: ma trận, đánh giá sơ bộ, từng người, chấm và nhận xét. */
"use strict";
const DGA={data:null,open:"",tab:"tong",key:sessionStorage.getItem("dg-admin")||""};
const dm=s=>s?s.slice(8,10)+"/"+s.slice(5,7):"";
/* Đánh giá sơ bộ: điểm phù hợp = 60% năng lực (tự chấm, có điểm của anh thì lấy trung bình hai bên) + 40% mức muốn làm, +0,3 nếu chọn phụ trách chính. */
function dgSelf(rec,k){ return dgAvg(rec?.areas?.[k]?.s); }
function dgCap(rec,note,k){ const s=dgSelf(rec,k), o=note?.sco?.[k]||0; return s&&o?(s+o)/2:(o||s); }
function dgFit(rec,note,k){ if(!rec) return 0; const c=dgCap(rec,note,k), w=DG_WV[rec.areas?.[k]?.want]||0; if(!c) return 0; return Math.min(5,0.6*c+0.4*(w||3)+((rec.lead||[]).includes(k)?0.3:0)); }
function dgRole(pid,k){ const p=DG_PLAN[k]||{}; return p.c===pid?"C":p.p===pid?"P":(p.cand||[]).includes(pid)?"U":""; }
function dgFlags(pid,rec,note){ const f=[]; if(!rec) return f;
  if(rec.load==="over") f.push(["bad","Thấy quá tải"]); else if(rec.load==="high") f.push(["warn","Thấy hơi nhiều việc"]); else if(rec.load==="low") f.push(["","Còn ít việc, nhận thêm được"]);
  if(rec.sat&&rec.sat<=2) f.push(["bad","Chưa hài lòng công việc hiện tại ("+rec.sat+"/5)"]);
  DG_AREAS.forEach(([k,,sh])=>{ const role=dgRole(pid,k), cap=dgCap(rec,note,k), w=rec.areas?.[k]?.want;
    if(role==="C"&&cap&&cap<3) f.push(["warn","Vai chính "+sh+" tự chấm "+dgF(cap)+": cần người kèm, đào tạo"]);
    if((role==="C"||role==="P")&&w==="no") f.push(["bad","Không muốn làm "+sh+" (đang được đề xuất "+(role==="C"?"vai chính":"vai phụ")+")"]);
    if((rec.lead||[]).includes(k)&&!role) f.push(["","Muốn phụ trách "+sh+", chưa có trong đề xuất"]);
    if(!role&&cap>=4&&w==="yes"&&!(rec.lead||[]).includes(k)) f.push(["","Mạnh và muốn làm "+sh+", đang chưa được giao"]); });
  const all=DG_AREAS.flatMap(([k])=>rec.areas?.[k]?.s||[]).filter(x=>x>0); if(all.length>=20&&dgAvg(all)>=4.5) f.push(["warn","Tự chấm gần như toàn 4–5: nên đối chiếu với kết quả thực tế"]);
  return f; }
function vDgAdmin(){
  if(DGA.data===null) return '<div class="empty">Đang tải kết quả…</div>';
  if(DGA.data.err) return '<div class="panel alert bad">Không tải được kết quả: '+esc(DGA.data.err)+'</div>';
  const R=DGA.data.recs||{}, N=DGA.data.notes||{}, ppl=DG_STAFF;
  const sent=ppl.filter(p=>R[p]?.status==="sent").length, draft=ppl.filter(p=>R[p]&&R[p].status!=="sent").length;
  let h='<div class="row between" style="gap:8px;align-items:flex-end;flex-wrap:wrap"><div><h1 style="margin:0">Tự đánh giá nhân sự</h1><div class="sub">Đợt 11/2026 · Chỉ người có mã quản lý xem được. Nhân sự làm phiếu tại trang Phiếu tự đánh giá bằng mã cá nhân.</div></div><div class="row" style="gap:6px"><a class="btn" href="./danh-gia.html?xem-thu" target="_blank">Xem phiếu mẫu</a><button class="btn" id="dgReload">Tải lại</button><button class="btn" id="dgOut">Thoát</button></div></div>';
  h+='<div class="grid kpis" style="margin-top:12px"><div class="tile '+(sent===ppl.length?"good":"")+'"><span class="v">'+sent+'/'+ppl.length+'</span><span class="l">Đã gửi phiếu</span></div><div class="tile '+(draft?"warn":"")+'"><span class="v">'+draft+'</span><span class="l">Đang làm dở</span></div><div class="tile"><span class="v">'+(ppl.length-sent-draft)+'</span><span class="l">Chưa mở phiếu</span></div></div>';
  const tabs=[["tong","Ma trận"],["so-bo","Đánh giá sơ bộ"],["nguoi","Từng người"]];
  h+='<div class="dgchips" style="margin:12px 0">'+tabs.map(([k,l])=>'<button type="button" data-dgtab="'+k+'"'+(DGA.tab===k?' class="on"':'')+'>'+l+'</button>').join("")+'</div>';
  const short=p=>esc((DG_NAME[p]||p).replace(/^(Anh|Chị)\s+/,""));
  if(DGA.tab==="tong"){
    h+='<div class="panel"><div class="sub" style="margin-bottom:6px">Ô là điểm năng lực trung bình 3 tiêu chí (1–5), đã gộp điểm của anh nếu có. ★ rất muốn làm, ✕ không muốn. Viền đậm: vai chính đề xuất ở bước 1, viền nhạt: vai phụ.</div><table class="dgmx"><thead><tr><th></th>'+ppl.map(p=>'<th>'+short(p)+'</th>').join("")+'</tr></thead><tbody>'
     +DG_AREAS.map(([k,,sh])=>'<tr><th>'+esc(sh)+'</th>'+ppl.map(p=>{ const rec=R[p], c=dgCap(rec,N[p],k), w=rec?.areas?.[k]?.want, role=dgRole(p,k);
       return '<td class="'+(role==="C"?"rc ":role==="P"?"rp ":"")+'" style="background:'+(c?'color-mix(in srgb,var(--brand) '+Math.round((c-1)/4*55+5)+'%,transparent)':'transparent')+'">'+(c?dgF(c):'<span class="sub">–</span>')+(w==="yes"?'<i>★</i>':w==="no"?'<i>✕</i>':'')+'</td>'; }).join("")+'</tr>').join("")
     +'<tr><th>Hài lòng</th>'+ppl.map(p=>'<td>'+(R[p]?.sat||'<span class="sub">–</span>')+'</td>').join("")+'</tr><tr><th>Khối lượng</th>'+ppl.map(p=>{ const l=R[p]?.load; return '<td style="font-size:11px'+(l==="over"?';color:var(--bad);font-weight:600':l==="high"?';color:var(--warn)':'')+'">'+(l?esc((DG_LOAD.find(x=>x[0]===l)||[,""])[1]):'–')+'</td>'; }).join("")+'</tr>'
     +'<tr><th>Trạng thái</th>'+ppl.map(p=>'<td style="font-size:11px">'+(R[p]?.status==="sent"?'<span style="color:var(--good)">Đã gửi</span>':R[p]?'Nháp':'<span class="sub">Chưa</span>')+'</td>').join("")+'</tr></tbody></table></div>';
  } else if(DGA.tab==="so-bo"){
    const any=ppl.some(p=>R[p]);
    h+='<div class="panel"><div class="sub">Điểm phù hợp = 60% năng lực (tự chấm, gộp điểm của anh nếu có) + 40% mức muốn làm, cộng 0,3 nếu người đó chọn phụ trách chính. Đây là gợi ý để anh xem cùng buổi thuyết trình, không thay quyết định của anh.</div></div>';
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
      let c='<div class="panel" style="margin-bottom:10px"><button class="dgph" data-dgopen="'+p+'"><b>'+esc(DG_NAME[p])+'</b><span class="sub">'+(rec?(rec.status==="sent"?"Đã gửi "+dm((rec.submittedAt||"").slice(0,10)):"Đang làm dở"):"Chưa mở phiếu")+(top.length?' · Mạnh: '+top.slice(0,2).map(x=>esc(x[0])).join(", "):'')+'</span><span>'+(op?"▲":"▼")+'</span></button>';
      if(!op) return c+'</div>';
      if(rec){ const L=x=>(x||[]).map(k=>esc((DG_AREAS.find(a=>a[0]===k)||[,,k])[2])).join(", ")||"–";
        c+='<div class="dgkv"><span>Hài lòng</span><b>'+(rec.sat||"–")+'/5</b><span>Khối lượng</span><b>'+esc((DG_LOAD.find(x=>x[0]===rec.load)||[,"–"])[1])+'</b><span>Muốn phụ trách chính</span><b>'+L(rec.lead)+'</b><span>Muốn hỗ trợ</span><b>'+L(rec.support)+'</b><span>Chủ đề thuyết trình</span><b>'+((rec.topics||[]).map(t=>esc((DG_TOP.find(x=>x[0]===t)||[,t])[1])).join(", ")||"–")+'</b><span>Cách làm việc</span><b>'+DG_COMMON.map(([k,t])=>esc(t)+": "+(rec.common?.[k]||"–")).join(" · ")+'</b></div>'
         +[["now","Đang làm nhiều nhất"],["good","Làm tốt nhất"],["hard","Khó, đang vướng"],["help","Cần hỗ trợ"],["learn","Muốn học thêm"],["other","Góp ý"]].filter(([k])=>rec[k]).map(([k,l])=>'<div style="margin-top:8px"><div class="sub">'+l+'</div><div style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(rec[k])+'</div></div>').join("");
        const fl=dgFlags(p,rec,n); if(fl.length) c+='<ul style="margin:8px 0 0;padding-left:18px">'+fl.map(([cl,t])=>'<li'+(cl?' style="color:var(--'+cl+')"':'')+'>'+esc(t)+'</li>').join("")+'</ul>'; }
      else c+='<div class="sub" style="margin-top:6px">Nhân sự chưa mở phiếu. Anh vẫn chấm trước được.</div>';
      c+='<h3 style="margin:12px 0 4px">Chấm của anh và đối chiếu</h3><div class="sub">Tự chấm là trung bình 3 tiêu chí. Ô của anh để trống thì chỉ dùng điểm tự chấm.</div>'
       +DG_AREAS.map(([k,t,sh])=>{ const s=rec?dgSelf(rec,k):0, w=rec?.areas?.[k]?.want, role=dgRole(p,k);
         return '<div class="dgcr"><span><b>'+esc(sh)+'</b>'+(role?' <small class="sub">('+({C:"đề xuất chính",P:"đề xuất phụ",U:"ứng viên"})[role]+')</small>':'')+'<br><small class="sub">Tự chấm '+(rec?.areas?.[k]?.s||[]).map(x=>x||"–").join(" · ")+' → '+dgF(s)+(w?' · '+esc((DG_WANT.find(x=>x[0]===w)||[,""])[1]):'')+'</small>'+(rec?.areas?.[k]?.note?'<br><small style="overflow-wrap:anywhere">'+esc(rec.areas[k].note)+'</small>':'')+'</span>'+dgSeg('data-dgo="'+p+':'+k+'"',n.sco?.[k]||0,5,DG_SCALE)+'</div>'; }).join("")
       +'<div class="f" style="margin-top:8px"><label for="dgon_'+p+'">Nhận xét của anh (chỉ anh thấy)</label><textarea id="dgon_'+p+'" data-dgot="'+p+'" rows="3">'+esc(n.text||"")+'</textarea></div><div style="margin-top:8px"><button class="btn pri" data-dgosave="'+p+'">Lưu chấm, nhận xét</button></div></div>';
      return c; }).join("");
  }
  return h;
}
function vKey(err){ return '<div class="panel narrow"><h1>Kết quả tự đánh giá</h1><p class="sub">Trang dành cho giám đốc. Nhập mã quản lý.</p><form id="kf" class="f" style="margin-top:12px"><label for="kc">Mã quản lý</label><input id="kc" type="password" autocomplete="off"><button class="btn pri" style="margin-top:10px">Xem kết quả</button></form>'+(err?'<div class="alert bad" style="margin-top:10px">'+esc(err)+'</div>':'')+'</div>'; }
async function load(){ const A=$("#app"); A.innerHTML='<div class="empty">Đang tải kết quả…</div>'; const r=await api({action:"list",adminKey:DGA.key});
  if(r.error){ DGA.data=null; A.innerHTML=vKey(r.error); bindKey(); return; } sessionStorage.setItem("dg-admin",DGA.key); DGA.data=r; render(); }
function bindKey(){ $("#kf")?.addEventListener("submit",e=>{ e.preventDefault(); DGA.key=$("#kc").value.trim(); if(DGA.key) load(); }); }
function render(){ const A=$("#app"); if(!DGA.data){ A.innerHTML=vKey(); bindKey(); return; } A.innerHTML=vDgAdmin(); bindAdmin(A); }
function bindAdmin(A){
  A.querySelectorAll("[data-dgtab]").forEach(b=>b.addEventListener("click",()=>{ DGA.tab=b.dataset.dgtab; render(); }));
  $("#dgReload")?.addEventListener("click",load);
  $("#dgOut")?.addEventListener("click",()=>{ sessionStorage.removeItem("dg-admin"); DGA.key=""; DGA.data=null; render(); });
  A.querySelectorAll("[data-dgopen]").forEach(b=>b.addEventListener("click",()=>{ DGA.open=DGA.open===b.dataset.dgopen?"":b.dataset.dgopen; render(); }));
  const N=DGA.data.notes||(DGA.data.notes={}), get=p=>N[p]||(N[p]={sco:{},text:""});
  A.querySelectorAll("[data-dgo]").forEach(b=>b.addEventListener("click",()=>{ const [p,k]=b.dataset.dgo.split(":"), n=get(p); n.sco=n.sco||{}; const v=+b.dataset.v; n.sco[k]=n.sco[k]===v?0:v; b.parentElement.querySelectorAll("button").forEach(x=>x.classList.toggle("on",+x.dataset.v===n.sco[k])); }));
  A.querySelectorAll("[data-dgot]").forEach(t=>t.addEventListener("input",()=>{ get(t.dataset.dgot).text=t.value.slice(0,3000); }));
  A.querySelectorAll("[data-dgosave]").forEach(b=>b.addEventListener("click",async()=>{ const p=b.dataset.dgosave; b.disabled=true; const r=await api({action:"note",adminKey:DGA.key,personId:p,note:get(p)}); b.disabled=false; if(r.error){ toast("Chưa lưu được: "+r.error); return; } N[p]=r.note; toast("Đã lưu"); render(); }));
}
if(DGA.key) load(); else render();
