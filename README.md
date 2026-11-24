# Đào tạo nội bộ BVI

Web tĩnh (GitHub Pages) cho đội BVI, FarmBase. Tách riêng khỏi BVI Điều hành.

## Trang
| Trang | Dành cho | Đăng nhập |
|---|---|---|
| `index.html` | Mọi người | Không |
| `danh-gia.html` | Nhân sự làm phiếu tự đánh giá (đợt 11/2026) | Chọn tên |
| `danh-gia.html?xem-thu` | Xem thử phiếu, không lưu | Không |
| `quy-trinh.html` | Mọi người: danh sách cẩm nang | Không |
| `cam-nang-ban-hang.html` | Sales, quản lý follow khách | Chọn tên |
| `cam-nang-marketing.html` | Marketing: 8 mảng làm song song, giám đốc giám sát | Chọn tên |
| `ket-qua.html` | Giám đốc: ma trận, đánh giá sơ bộ, từng người, chấm và nhận xét | Mã PIN |

## Không dùng cơ sở dữ liệu
- Nhân sự chọn tên, làm phiếu (tự lưu trên điện thoại của họ), bấm Gửi phiếu. Trang nén phiếu thành một đường link `ket-qua.html#r=…` để gửi cho giám đốc qua Zalo.
- Giám đốc mở link (hoặc dán nhiều link vào ô Thêm phiếu) ở trang `ket-qua.html`, nhập mã PIN. Phiếu và nhận xét lưu trong trình duyệt của máy đó (localStorage). Đổi máy hoặc xóa dữ liệu trình duyệt thì dùng nút Tải bản sao lưu / Mở bản sao lưu.
- Mã PIN chỉ lưu dạng băm SHA-256 trong `assets/dg-admin.js` (`PIN_SHA`). Đổi PIN: tính `printf %s 'PIN_MOI' | sha256sum` rồi thay giá trị. PIN chỉ khóa giao diện; dữ liệu không nằm trên máy chủ nào.

## Bật web
Settings › Pages › Deploy from branch `main`, thư mục `/`. Địa chỉ: https://sfportal.github.io/web-elearning-noi-bo/

## Đánh giá sơ bộ
Điểm phù hợp mỗi đầu việc = 45% kỹ năng đầu việc (trung bình 3 tiêu chí tự chấm; có điểm của giám đốc thì lấy trung bình hai bên) + 25% năng lực chung mà đầu việc đó cần + 30% mức muốn làm (rất muốn 5, làm được 3, không muốn 1), cộng 0,3 nếu người đó chọn phụ trách chính.

- **Phù hợp**: điểm từ 3,6, có muốn làm, kỹ năng từ 3 (tối đa 3 đầu việc).
- **Chưa phù hợp**: không muốn làm, hoặc kỹ năng dưới 2,5, hoặc từ 2 năng lực cần thiết chỉ đạt 1–2 điểm.

Năng lực chung (10 mục, `DG_COMP`) chấm theo thang hành vi (BARS): mỗi mục có mô tả mức 1, 3, 5. Bộ năng lực tham khảo SHL Great Eight và Lominger, rút gọn cho việc thực tế ở BVI. Năng lực cần cho từng đầu việc nằm ở `DG_REQ`; đề xuất phân vai bước 1 ở `DG_PLAN`, cùng trong `assets/dg-common.js`.

## Thẻ điểm cân bằng (BSC)
Mục riêng trong phiếu và tab "Thẻ điểm BSC" ở trang kết quả. 4 góc nhìn, mỗi góc 2 chỉ số (`DG_BSC` trong `assets/dg-common.js`): Tài chính 25%, Khách hàng 25%, Quy trình nội bộ 30%, Học hỏi phát triển 20%. Chấm mức đạt so với mục tiêu 3 tháng gần đây: 1 dưới 50%, 2 từ 50–79%, 3 từ 80–99%, 4 đạt, 5 vượt; chỉ số không thuộc phần việc thì chọn Không áp dụng. Tổng = cộng theo trọng số các góc có điểm (có điểm của giám đốc thì lấy trung bình hai bên). Xếp loại: từ 4,5 Xuất sắc, từ 3,5 Tốt, từ 2,5 Đạt, dưới 2,5 Cần cải thiện. Không ghi số tiền, chỉ chấm mức đạt.

## Quy tắc
- Chữ tiếng Việt, ngắn gọn, dùng tốt ở rộng 390px, không cuộn ngang.
- Không ghi CCCD, số sổ đỏ, số điện thoại, số tiền vào repo hay trang. Máy chủ che chuỗi số dài trong ô chữ.

## Cẩm nang (Xây dựng quy trình)
- `quy-trinh.html` liệt kê các cẩm nang. Thêm cẩm nang mới: tạo trang `cam-nang-<ten>.html`, đặt `window.CN_ID` riêng nếu cần, thêm thẻ vào `quy-trinh.html`.
- Người xem chọn tên (danh sách lấy từ `DG_NAME` trong `assets/dg-common.js`, hoặc gõ tên khác). Tên hiện trên góp ý và tự điền vào tin nhắn mẫu.
- Góp ý: nút "Góp ý" ở từng mục, ghi "muốn sửa thành" và lý do. Tab Góp ý gom tất cả, có nút Chép để gửi qua Zalo.
- Góp ý chung lưu ở bảng `camnang_gopy` trên Supabase (cấu hình trong `assets/cn-config.js`, khóa công khai). Khách chỉ được đọc, thêm góp ý và đánh dấu đã xử lý, không sửa hay xóa được. Cột `cam_nang` tách góp ý theo từng cẩm nang (trang đặt `window.CN_ID`, mặc định `ban-hang`). Để trống `url` thì góp ý chỉ lưu trên máy từng người. Mở trang với `?quan-ly` để hiện nút "Đánh dấu đã xử lý". Chuỗi số dài trong góp ý được che trước khi gửi.
- Bản soạn gốc nằm ở thư mục dự án `SalesKit_TXNG_2026-11/CamNang_BanHang_CSKH.html`; sửa nội dung ở đó rồi chép sang đây.
- Cẩm nang marketing (`cam-nang-marketing.html`, `CN_ID='marketing'`): lịch Fanpage tháng 12 lấy từ file lịch đã quyết (16 chốt, 3 cân nhắc, 8 bỏ), bản 2 chia 8 mảng (nội dung, văn phong, quảng cáo Facebook, offline, sự kiện, chương trình, đo lường, Chiến dịch 10.000 ha), không có việc từng ngày và KPI. Bản soạn gốc ở thư mục dự án `Marketing_2026-11/CamNang_Marketing/`. Lịch tháng mới: thay mảng `CAL` trong trang.
