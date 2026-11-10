/* Phiếu tự đánh giá nhân sự BVI: dùng chung cho trang làm phiếu và trang kết quả. */
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(t){ const el=document.createElement("div"); el.className="toast"; el.textContent=t; document.body.appendChild(el); setTimeout(()=>el.remove(),2400); }
const dmy=s=>s?s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4):"";
async function api(body){
  if(!window.DG_API) return {error:"Web chưa nối máy chủ lưu phiếu. Báo anh Uy."};
  try{ const r=await fetch(window.DG_API,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)}); return await r.json(); }
  catch(e){ return {error:"Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại."}; }
}
const DG_AREAS=[
 ["a1","Điều phối, giám sát tiến độ","Điều phối",["Lập kế hoạch tuần, chia việc có hạn rõ","Theo dõi số liệu, phát hiện việc trễ sớm","Ra quyết định, gỡ vướng giữa các bộ phận"]],
 ["a2","Triển khai dự án tại xã (hiện trường)","Hiện trường",["Làm việc với cán bộ xã, đại diện mã, bà con","Tổ chức buổi thực địa đủ việc trong 1 lần đi","Dùng thiết bị: flycam, app thu thập, định vị"]],
 ["a3","Hồ sơ, hệ thống FarmBase, nộp hồ sơ","Hồ sơ",["Hiểu quy định hồ sơ mã nội địa và GACC","Thao tác FarmBase, Cổng DVC, web điều hành","Cẩn thận, đối chiếu không sai lệch"]],
 ["a4","Kỹ thuật nông nghiệp","Kỹ thuật",["Kiến thức VietGAP, ISPM 6, sâu bệnh sầu riêng","Giảng dễ hiểu cho bà con","Hướng dẫn ghi nhật ký, bẫy, kho đúng chuẩn"]],
 ["a5","Chạy chiến dịch 10.000 ha","10.000 ha",["Tổ chức sự kiện đông người","Thuyết trình trước hội trường, đối tác","Chốt đăng ký, chốt tài trợ"]],
 ["a6","Tư vấn bán hàng giải pháp (MVT, TXNG, dịch vụ mở rộng)","Tư vấn",["Nắm sản phẩm, bảng giá MVT, TXNG, dịch vụ mở rộng","Hỏi đúng nhu cầu, xử lý khi khách từ chối","Lập báo giá, đề xuất, theo đến khi ký"]],
 ["a7","Xây dựng đội cộng tác viên bán hàng","Đội CTV",["Có mạng lưới địa phương, HTX","Tuyển và đào tạo người khác","Theo dõi, tạo động lực cho CTV"]],
 ["a8","Quản lý nội bộ (thu chi, hóa đơn, chấm công, hồ sơ gốc)","Nội bộ",["Ghi chép thu chi, hóa đơn chính xác","Lưu trữ, scan, tìm lại hồ sơ nhanh","Đúng hạn với việc định kỳ"]]];
const DG_COMMON=[["c1","Chủ động báo vướng sớm"],["c2","Cập nhật việc và báo cáo nhanh mỗi ngày"],["c3","Phối hợp, bàn giao đúng hạn"],["c4","Học công cụ mới"]];
const DG_SCALE=["","Chưa làm bao giờ","Làm được khi có người kèm","Tự làm trọn việc","Làm tốt, ổn định, kèm được người khác","Cải tiến quy trình, đào tạo lại cho đội"];
const DG_WANT=[["yes","Rất muốn làm"],["maybe","Làm được"],["no","Không muốn"]], DG_WV={yes:5,maybe:3,no:1};
const DG_LOAD=[["low","Còn ít việc"],["ok","Vừa sức"],["high","Hơi nhiều"],["over","Quá tải"]];
const DG_TOP=[["mvt","Mã vùng trồng"],["txng","Truy xuất nguồn gốc"],["tuvan","Tư vấn khách hàng"],["cd10000","Chiến dịch 10.000 ha"]];
// Đề xuất phân vai bước 1 (10/11/2026): c = chính, p = phụ, cand = ứng viên chốt sau thuyết trình.
const DG_PLAN={a1:{c:"trinh",p:"tuan"},a2:{c:"huy",p:"minh"},a3:{c:"man",p:"tuan"},a4:{c:"minh"},a5:{cand:["trinh","tuan","minh"]},a6:{cand:["trinh","tuan","minh"],p:"ngoc"},a7:{cand:["tuan","huy"]},a8:{c:"ngoc",p:"man"}};
const DG_STAFF=["trinh","tuan","man","ngoc","huy","minh"];
const DG_NAME={trinh:"Chị Trinh",tuan:"Anh Tuấn",man:"Chị Mẫn",ngoc:"Chị Ngọc",huy:"Anh Huy",minh:"Anh Minh"};
const dgAvg=a=>{ const v=(a||[]).filter(x=>x>0); return v.length?v.reduce((s,x)=>s+x,0)/v.length:0; };
const dgF=n=>n?(Math.round(n*10)/10).toLocaleString("vi-VN"):"–";
function dgBlank(){ const areas={}; DG_AREAS.forEach(a=>areas[a[0]]={s:[0,0,0],want:"",note:""}); return {now:"",sat:0,load:"",good:"",hard:"",help:"",areas,common:{},lead:[],support:[],learn:"",topics:[],other:""}; }
function dgFill(r){ const b=dgBlank(); if(!r) return b; const o={...b,...r}; o.areas={...b.areas}; DG_AREAS.forEach(([k])=>{ const x=r.areas?.[k]; if(x) o.areas[k]={s:[0,1,2].map(i=>x.s?.[i]||0),want:x.want||"",note:x.note||""}; }); o.common={...(r.common||{})}; o.lead=[...(r.lead||[])]; o.support=[...(r.support||[])]; o.topics=[...(r.topics||[])]; return o; }
function dgSeg(attr,val,n,labels){ let h='<div class="dgseg" role="group">'; for(let i=1;i<=n;i++) h+='<button type="button" '+attr+' data-v="'+i+'"'+(val===i?' class="on"':'')+' title="'+esc(labels?labels[i]:"")+'" aria-pressed="'+(val===i)+'">'+i+'</button>'; return h+'</div>'; }
function dgChips(attr,opts,val,multi){ return '<div class="dgchips">'+opts.map(([k,l])=>'<button type="button" '+attr+' data-v="'+k+'"'+((multi?(val||[]).includes(k):val===k)?' class="on"':'')+'>'+esc(l)+'</button>').join("")+'</div>'; }
