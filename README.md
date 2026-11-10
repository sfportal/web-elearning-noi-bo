# Đào tạo nội bộ BVI

Web tĩnh (GitHub Pages) cho đội BVI, FarmBase. Tách riêng khỏi BVI Điều hành.

## Trang
| Trang | Dành cho | Đăng nhập |
|---|---|---|
| `index.html` | Mọi người | Không |
| `danh-gia.html` | Nhân sự làm phiếu tự đánh giá (đợt 11/2026) | Chọn tên |
| `danh-gia.html?xem-thu` | Xem thử phiếu, không lưu | Không |
| `ket-qua.html` | Giám đốc: ma trận, đánh giá sơ bộ, từng người, chấm và nhận xét | Mã PIN |

## Không dùng cơ sở dữ liệu
- Nhân sự chọn tên, làm phiếu (tự lưu trên điện thoại của họ), bấm Gửi phiếu. Trang nén phiếu thành một đường link `ket-qua.html#r=…` để gửi cho giám đốc qua Zalo.
- Giám đốc mở link (hoặc dán nhiều link vào ô Thêm phiếu) ở trang `ket-qua.html`, nhập mã PIN. Phiếu và nhận xét lưu trong trình duyệt của máy đó (localStorage). Đổi máy hoặc xóa dữ liệu trình duyệt thì dùng nút Tải bản sao lưu / Mở bản sao lưu.
- Mã PIN chỉ lưu dạng băm SHA-256 trong `assets/dg-admin.js` (`PIN_SHA`). Đổi PIN: tính `printf %s 'PIN_MOI' | sha256sum` rồi thay giá trị. PIN chỉ khóa giao diện; dữ liệu không nằm trên máy chủ nào.

## Bật web
Settings › Pages › Deploy from branch `main`, thư mục `/`. Địa chỉ: https://sfportal.github.io/web-elearning-noi-bo/

## Đánh giá sơ bộ
Điểm phù hợp mỗi đầu việc = 60% năng lực (trung bình 3 tiêu chí tự chấm; có điểm của giám đốc thì lấy trung bình hai bên) + 40% mức muốn làm (rất muốn 5, làm được 3, không muốn 1), cộng 0,3 nếu người đó chọn phụ trách chính. Đề xuất phân vai bước 1 nằm ở `DG_PLAN` trong `assets/dg-common.js`.

## Quy tắc
- Chữ tiếng Việt, ngắn gọn, dùng tốt ở rộng 390px, không cuộn ngang.
- Không ghi CCCD, số sổ đỏ, số điện thoại, số tiền vào repo hay trang. Máy chủ che chuỗi số dài trong ô chữ.
