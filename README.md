# Đào tạo nội bộ BVI

Web tĩnh (GitHub Pages) cho đội BVI, FarmBase. Tách riêng khỏi BVI Điều hành.

## Trang
| Trang | Dành cho | Đăng nhập |
|---|---|---|
| `index.html` | Mọi người | Không |
| `danh-gia.html` | Nhân sự làm phiếu tự đánh giá (đợt 11/2026) | Mã cá nhân |
| `danh-gia.html?xem-thu` | Xem thử phiếu, không lưu | Không |
| `ket-qua.html` | Giám đốc: ma trận, đánh giá sơ bộ, từng người, chấm và nhận xét | Mã quản lý |

## Lưu dữ liệu
Phiếu ghi vào Google Sheet của giám đốc qua Apps Script (`apps-script/Code.gs`). Repo không chứa dữ liệu, mã cá nhân hay mã quản lý.

Cài một lần:
1. Tạo Google Sheet mới › Tiện ích mở rộng › Apps Script › dán `apps-script/Code.gs` › Lưu.
2. Chạy hàm `caiDat`, cấp quyền. Xem mã trong Nhật ký thực thi. Gửi mã cá nhân riêng từng người qua Zalo.
3. Triển khai › Ứng dụng web: thực thi với tư cách "Tôi", truy cập "Bất kỳ ai". Chép đường dẫn `…/exec`.
4. Dán đường dẫn vào `assets/config.js` (`window.DG_API`), commit, push.
5. Bật GitHub Pages: Settings › Pages › Deploy from branch `main`, thư mục `/`.

Sửa `Code.gs` xong phải Triển khai › Quản lý triển khai › sửa phiên bản mới, đường dẫn giữ nguyên.

## Đánh giá sơ bộ
Điểm phù hợp mỗi đầu việc = 60% năng lực (trung bình 3 tiêu chí tự chấm; có điểm của giám đốc thì lấy trung bình hai bên) + 40% mức muốn làm (rất muốn 5, làm được 3, không muốn 1), cộng 0,3 nếu người đó chọn phụ trách chính. Đề xuất phân vai bước 1 nằm ở `DG_PLAN` trong `assets/dg-common.js`.

## Quy tắc
- Chữ tiếng Việt, ngắn gọn, dùng tốt ở rộng 390px, không cuộn ngang.
- Không ghi CCCD, số sổ đỏ, số điện thoại, số tiền vào repo hay trang. Máy chủ che chuỗi số dài trong ô chữ.
