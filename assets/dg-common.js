/* Phiếu tự đánh giá nhân sự BVI: dùng chung cho trang làm phiếu và trang kết quả. */
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(t){ const el=document.createElement("div"); el.className="toast"; el.textContent=t; document.body.appendChild(el); setTimeout(()=>el.remove(),2400); }
const dmy=s=>s?s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(0,4):"";
// Không dùng máy chủ: phiếu được nén thành một đường link, nhân sự gửi link cho giám đốc qua Zalo.
const b64u={ enc:u8=>{ let s=""; u8.forEach(c=>s+=String.fromCharCode(c)); return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); },
  dec:t=>{ t=t.replace(/-/g,"+").replace(/_/g,"/"); const s=atob(t); return Uint8Array.from(s,c=>c.charCodeAt(0)); } };
async function pipe(u8,stream){ return new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer()); }
async function dgEncode(obj){ const u8=new TextEncoder().encode(JSON.stringify(obj));
  if(typeof CompressionStream==="function"){ try{ return "z"+b64u.enc(await pipe(u8,new CompressionStream("deflate-raw"))); }catch(_){} }
  return "j"+b64u.enc(u8); }
async function dgDecode(code){ code=String(code||"").trim(); const k=code[0], u8=b64u.dec(code.slice(1));
  const raw=k==="z"?await pipe(u8,new DecompressionStream("deflate-raw")):u8; return JSON.parse(new TextDecoder().decode(raw)); }
const DG_AREAS=[
 ["a1","Điều phối, giám sát tiến độ","Điều phối",["Lập kế hoạch tuần, chia việc có hạn rõ","Theo dõi số liệu, phát hiện việc trễ sớm","Ra quyết định, gỡ vướng giữa các bộ phận"]],
 ["a2","Triển khai dự án tại xã (hiện trường)","Hiện trường",["Làm việc với cán bộ xã, đại diện mã, bà con","Tổ chức buổi thực địa đủ việc trong 1 lần đi","Dùng thiết bị: flycam, app thu thập, định vị"]],
 ["a3","Hồ sơ, hệ thống FarmBase, nộp hồ sơ","Hồ sơ",["Hiểu quy định hồ sơ mã nội địa và GACC","Thao tác FarmBase, Cổng DVC, web điều hành","Cẩn thận, đối chiếu không sai lệch"]],
 ["a4","Kỹ thuật nông nghiệp","Kỹ thuật",["Kiến thức VietGAP, ISPM 6, sâu bệnh sầu riêng","Giảng dễ hiểu cho bà con","Hướng dẫn ghi nhật ký, bẫy, kho đúng chuẩn"]],
 ["a5","Chạy chiến dịch 10.000 ha","10.000 ha",["Tổ chức sự kiện đông người","Thuyết trình trước hội trường, đối tác","Chốt đăng ký, chốt tài trợ"]],
 ["a6","Tư vấn bán hàng giải pháp (MVT, TXNG, dịch vụ mở rộng)","Tư vấn",["Nắm sản phẩm, bảng giá MVT, TXNG, dịch vụ mở rộng","Hỏi đúng nhu cầu, xử lý khi khách từ chối","Lập báo giá, đề xuất, theo đến khi ký"]],
 ["a7","Xây dựng đội cộng tác viên bán hàng","Đội CTV",["Có mạng lưới địa phương, HTX","Tuyển và đào tạo người khác","Theo dõi, tạo động lực cho CTV"]],
 ["a8","Quản lý nội bộ (thu chi, hóa đơn, chấm công, hồ sơ gốc)","Nội bộ",["Ghi chép thu chi, hóa đơn chính xác","Lưu trữ, scan, tìm lại hồ sơ nhanh","Đúng hạn với việc định kỳ"]]];
// Năng lực chung: thang hành vi 1–5 (kiểu BARS), tham khảo các khung năng lực phổ biến (SHL Great Eight, Lominger/Korn Ferry), rút gọn theo việc của BVI.
// Mỗi năng lực: [mã, tên, mô tả ngắn, [mức 1, mức 3, mức 5]]
const DG_COMP=[
 ["k1","Giải quyết vấn đề","Tìm nguyên nhân, đưa phương án, xử lý dứt điểm",["Gặp vướng thì chờ người khác xử lý","Tự tìm nguyên nhân, đưa được 1–2 cách xử lý","Xử lý được việc khó, mới; ngăn lỗi lặp lại bằng cách sửa quy trình"]],
 ["k2","Sắp xếp công việc, thời gian","Lên kế hoạch, ưu tiên, giữ hạn",["Hay quên việc, trễ hạn","Có danh sách việc, phần lớn đúng hạn","Lên kế hoạch tuần cho mình và người khác, cân việc khi có thay đổi"]],
 ["k3","Giao tiếp, thuyết phục","Nói rõ, nghe hiểu, làm người khác đồng ý",["Khó diễn đạt, ngại nói trước đông người","Trình bày rõ với 1–2 người, trả lời được câu hỏi","Thuyết phục được khách, cán bộ, hội trường đông người"]],
 ["k4","Phối hợp, làm việc nhóm","Chia sẻ thông tin, hỗ trợ, bàn giao đúng hẹn",["Làm riêng, ít báo cho người liên quan","Bàn giao đủ, báo đúng người, hỗ trợ khi được nhờ","Chủ động kết nối các bên, gỡ vướng giữa các bộ phận"]],
 ["k5","Chủ động, trách nhiệm","Tự nhận việc, chịu kết quả, báo vướng sớm",["Chờ giao mới làm, báo vướng khi đã trễ","Tự làm trọn việc được giao, báo vướng sớm","Tự thấy việc cần làm, nhận và chịu kết quả đến cùng"]],
 ["k6","Học hỏi, thích nghi","Học nhanh kiến thức, công cụ mới; thích nghi thay đổi",["Ngại thay đổi, cần chỉ nhiều lần","Học được công cụ mới sau 1–2 lần hướng dẫn","Tự học, áp dụng nhanh và hướng dẫn lại cho người khác"]],
 ["k7","Cẩn thận, chính xác","Làm đúng ngay lần đầu, kiểm tra lại số liệu",["Hay sai sót, phải làm lại","Ít sai, tự kiểm tra trước khi giao","Gần như không sai, phát hiện được lỗi của người khác"]],
 ["k8","Hướng khách hàng","Hiểu nhu cầu khách, nông dân, giữ quan hệ lâu dài",["Làm theo việc, ít hỏi nhu cầu khách","Hỏi đúng nhu cầu, phản hồi khách kịp thời","Được khách tin, giới thiệu thêm khách mới"]],
 ["k9","Chịu áp lực","Giữ bình tĩnh, chất lượng khi việc dồn, đi xa",["Dễ căng thẳng, bỏ dở khi việc dồn","Vẫn làm ổn khi việc dồn trong thời gian ngắn","Giữ được nhịp và tinh thần cho cả nhóm lúc cao điểm"]],
 ["k10","Dẫn dắt, kèm người khác","Hướng dẫn, giao việc, tạo động lực",["Chưa từng hướng dẫn ai","Kèm được 1 người làm một việc cụ thể","Dẫn một nhóm, đào tạo người mới thành thạo"]]];
// Năng lực chung cần cho từng đầu việc (dùng để đánh giá phù hợp, chưa phù hợp).
const DG_REQ={a1:["k2","k1","k4","k10","k9"],a2:["k3","k5","k9","k1","k8"],a3:["k7","k2","k6","k5"],a4:["k6","k3","k7","k8"],a5:["k2","k3","k10","k9","k4"],a6:["k3","k8","k1","k5"],a7:["k10","k3","k5","k4"],a8:["k7","k2","k5"]};
// Thẻ điểm cân bằng (Balanced Scorecard) rút gọn cho nội bộ: 4 góc nhìn, mỗi góc 2 chỉ số, chấm mức đạt so với mục tiêu 3 tháng gần đây.
// [mã, tên, trọng số %, [[mã chỉ số, nội dung]]]
const DG_BSC=[
 ["f","Tài chính",25,[["f1","Đạt chỉ tiêu doanh thu, hợp đồng, thu tiền được giao"],["f2","Chi đúng kế hoạch, chứng từ đủ, không thất thoát"]]],
 ["c","Khách hàng",25,[["c1","Khách, xã, bà con hài lòng, ít phàn nàn"],["c2","Phản hồi khách đúng hẹn, theo việc đến khi xong"]]],
 ["p","Quy trình nội bộ",30,[["p1","Việc được giao xong đúng hạn"],["p2","Hồ sơ, số liệu đúng ngay lần đầu, cập nhật lên hệ thống"]]],
 ["l","Học hỏi, phát triển",20,[["l1","Học thêm được kỹ năng, công cụ mới và dùng vào việc"],["l2","Chia sẻ, kèm người khác, góp ý cải tiến"]]]];
const DG_BSC_SCALE=["","Dưới 50% mục tiêu","50–79% mục tiêu","80–99%, gần đạt","Đạt 100%","Vượt mục tiêu"];
const dgBscK=()=>DG_BSC.flatMap(g=>g[3].map(i=>i[0]));
// Điểm BSC: trung bình chỉ số mỗi góc (bỏ chỉ số "không áp dụng" = -1), cộng theo trọng số các góc có điểm.
function dgBscScore(get){ let sw=0,sv=0; const per={}; DG_BSC.forEach(([g,,w,it])=>{ const v=dgAvg(it.map(([k])=>get(k))); per[g]=v; if(v){ sw+=w; sv+=w*v; } }); return {per,total:sw?sv/sw:0}; }
const dgBscRank=t=>!t?"":t>=4.5?"Xuất sắc":t>=3.5?"Tốt":t>=2.5?"Đạt":"Cần cải thiện";
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
function dgBlank(){ const areas={}; DG_AREAS.forEach(a=>areas[a[0]]={s:[0,0,0],want:"",note:""}); return {now:"",sat:0,load:"",good:"",hard:"",help:"",areas,comp:{},ex:"",bsc:{},goal:{},lead:[],support:[],learn:"",topics:[],other:""}; }
function dgFill(r){ const b=dgBlank(); if(!r) return b; const o={...b,...r}; o.areas={...b.areas}; DG_AREAS.forEach(([k])=>{ const x=r.areas?.[k]; if(x) o.areas[k]={s:[0,1,2].map(i=>x.s?.[i]||0),want:x.want||"",note:x.note||""}; }); o.comp={...(r.comp||{})}; o.bsc={...(r.bsc||{})}; o.goal={...(r.goal||{})}; o.lead=[...(r.lead||[])]; o.support=[...(r.support||[])]; o.topics=[...(r.topics||[])]; return o; }
function dgSeg(attr,val,n,labels){ let h='<div class="dgseg" role="group">'; for(let i=1;i<=n;i++) h+='<button type="button" '+attr+' data-v="'+i+'"'+(val===i?' class="on"':'')+' title="'+esc(labels?labels[i]:"")+'" aria-pressed="'+(val===i)+'">'+i+'</button>'; return h+'</div>'; }
function dgChips(attr,opts,val,multi){ return '<div class="dgchips">'+opts.map(([k,l])=>'<button type="button" '+attr+' data-v="'+k+'"'+((multi?(val||[]).includes(k):val===k)?' class="on"':'')+'>'+esc(l)+'</button>').join("")+'</div>'; }
const dgCompName=k=>(DG_COMP.find(c=>c[0]===k)||[,k])[1];
