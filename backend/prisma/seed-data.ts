// ================================================================
// SEED DATA — Nguồn duy nhất để biết DB có những gì sau khi seed.
//
// Quy tắc:
// - Sửa/thêm/xóa ở file này → chạy `npm run prisma:seed` để đồng bộ DB.
// - Seeder dùng `upsert` theo `name` (unique) → an toàn khi chạy lại.
// - KHÔNG đổi `name` của entry đã seed (vì name là khóa upsert).
//   Muốn đổi tên hiển thị: thêm field mới thay vì sửa `name`.
//
// Thiết kế: ActivityCategory và InterestTag dùng CÙNG danh sách `name`
// → user chọn interest "Bóng đá" sẽ match được activity có category/tag "Bóng đá".
// Category dùng cho lọc/duyệt UI; InterestTag dùng cho matching sở thích.
// ================================================================

export interface SeedItem {
  name: string;
  key: string; // Kebab-case English key for code/URLs.
  description: string; // Chỉ dùng cho ActivityCategory; InterestTag bỏ qua.
}

export const SEED_ITEMS: SeedItem[] = [
  // --- Ăn uống ---
  { name: 'Ăn uống',     key: 'food',          description: 'Đi ăn, food tour, hẹn ăn trưa quanh trường' },
  { name: 'Cà phê',      key: 'coffee',        description: 'Hẹn cà phê, học bài quán, chill quán' },

  // --- Học thuật ---
  { name: 'Học nhóm',    key: 'study-group',   description: 'Ôn thi, làm bài tập, project nhóm' },
  { name: 'Lập trình',   key: 'programming',   description: 'Code dạo, hackathon, làm dự án IT' },
  { name: 'Tiếng Anh',   key: 'english',       description: 'Luyện nói, học IELTS/TOEIC, English club' },

  // --- Thể thao ---
  { name: 'Bóng đá',     key: 'football',      description: 'Đá bóng sân 5/7/11, xem bóng cùng nhau' },
  { name: 'Cầu lông',    key: 'badminton',     description: 'Đánh cầu lông tại sân trong/ngoài trường' },
  { name: 'Gym',         key: 'gym',           description: 'Tập gym, fitness, đi phòng tập cùng nhau' },
  { name: 'Chạy bộ',     key: 'running',       description: 'Chạy bộ buổi sáng/chiều, marathon mini' },

  // --- Giải trí ---
  { name: 'Xem phim',    key: 'movies',        description: 'Đi rạp, xem phim chung tại nhà' },
  { name: 'Karaoke',     key: 'karaoke',       description: 'Hát karaoke nhóm bạn cuối tuần' },
  { name: 'Âm nhạc',     key: 'music',         description: 'Chơi nhạc cụ, đi xem show, jam session' },

  // --- Board games & trí tuệ ---
  { name: 'Cờ vua',      key: 'chess',         description: 'Đánh cờ vua, giao lưu cờ tướng/cờ caro' },
  { name: 'Board games', key: 'board-games',   description: 'UNO, Ma sói, board game cafe' },

  // --- Sở thích khác ---
  { name: 'Nhiếp ảnh',   key: 'photography',   description: 'Chụp ảnh dạo phố, photo walk' },
];
