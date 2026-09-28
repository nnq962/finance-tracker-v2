<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Quy tắc sử dụng component giao diện

### Ưu tiên tái sử dụng

- Trước khi thêm hoặc sửa giao diện, phải kiểm tra các component hiện có, API, variant và cách sử dụng trong dự án, đặc biệt ở `components/ui`, `components/forms` và các component của từng tính năng.
- Nếu đã có component đáp ứng nhu cầu, bắt buộc tái sử dụng component đó cùng các variant/props có sẵn. Không tự dựng bản tương đương bằng HTML/CSS, ví dụ dùng `span` tự tạo badge khi đã có `Badge`, hoặc tự làm hiệu ứng nhấn khi `Card` đã có `pressable`.
- Nếu chưa có component phù hợp trong dự án, kiểm tra registry shadcn và ưu tiên cài bằng shadcn CLI theo cấu hình hiện có trong `components.json`. Kiểm tra thay đổi khi cài; không ghi đè component đã được tùy chỉnh trong dự án.
- Chỉ tự thiết kế component mới khi cả component hiện có lẫn component có thể cài qua shadcn CLI đều không đáp ứng nhu cầu. Nêu ngắn gọn lý do trước khi thực hiện.

### Giữ nguyên thiết kế của component

- Khi dùng component có sẵn, giữ nguyên font, cỡ chữ, độ đậm, chiều cao, padding nội bộ, bo góc, viền, bóng và các trạng thái tương tác. Ưu tiên API, `variant`, `size` và các props mà component cung cấp; không tự ghi đè bằng class hoặc style để tạo kiểu mới.
- Chỉ thêm các điều chỉnh layout thực sự cần thiết cho vị trí sử dụng, ví dụ `w-full`, grid/flex, căn chỉnh, khoảng cách giữa các component và responsive hiển thị. Ưu tiên đặt các điều chỉnh này trên phần tử bao ngoài khi phù hợp.
- Chỉ tùy chỉnh thiết kế khi người dùng yêu cầu rõ ràng hoặc có yêu cầu chức năng/accessibility cụ thể mà API hiện có không đáp ứng. Trong trường hợp sau, nêu rõ lý do và chỉ thay đổi phần tối thiểu cần thiết; không xem sở thích thẩm mỹ của agent là lý do để ghi đè style.
- Yêu cầu đổi một thuộc tính không cho phép thay đổi các thuộc tính khác: ví dụ đổi màu badge phải giữ nguyên font, kích thước, padding và hình dạng; đặt button full width chỉ thêm `w-full`, không tự thêm `h-*`, `text-*` hay đổi padding.
- Trước khi hoàn tất, kiểm tra diff để loại bỏ component tự dựng trùng chức năng và các override style không được yêu cầu.
