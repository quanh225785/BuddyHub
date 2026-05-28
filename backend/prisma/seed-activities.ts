import { ActivityStatus, Gender, PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Ngày gốc để tính offset (thời điểm chạy seed)
function daysFromNow(days: number, hour = 12, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

const DEMO_USERS = [
  {
    email: 'nguyen.vannam123456@sis.hust.edu.vn',
    studentId: '20230001',
    name: 'Nguyễn Văn Nam',
    gender: Gender.MALE,
    faculty: 'Trường CNTT & TT',
    schoolYear: 2,
    bio: 'Mình thích bóng đá và lập trình. Hay tổ chức sự kiện cho mọi người.',
  },
  {
    email: 'tran.thilan654321@sis.hust.edu.vn',
    studentId: '20230002',
    name: 'Trần Thị Lan',
    gender: Gender.FEMALE,
    faculty: 'Khoa Ngoại Ngữ',
    schoolYear: 3,
    bio: 'Mê tiếng Anh và nhiếp ảnh. Thích khám phá quán cà phê mới.',
  },
  {
    email: 'le.minhkhoa789012@sis.hust.edu.vn',
    studentId: '20230003',
    name: 'Lê Minh Khoa',
    gender: Gender.MALE,
    faculty: 'Trường Điện - Điện tử',
    schoolYear: 1,
    bio: 'Năm nhất, đang tìm bạn chạy bộ sáng sớm và học nhóm.',
  },
  {
    email: 'pham.thuyhoa345678@sis.hust.edu.vn',
    studentId: '20230004',
    name: 'Phạm Thuỳ Hoa',
    gender: Gender.FEMALE,
    faculty: 'Trường Kinh Tế',
    schoolYear: 4,
    bio: 'Năm cuối, thích board game và xem phim. Cần bạn học nhóm ôn thi tốt nghiệp.',
  },
];

interface ActivitySeed {
  hostIndex: number;
  categoryName: string;
  title: string;
  location: string;
  purpose: string;
  description?: string;
  startDaysFromNow: number;
  startHour: number;
  startMinute?: number;
  durationHours?: number;
  deadlineDaysFromNow: number;
  maxSlots: number;
  gender: Gender;
  chatLink: string;
  status?: ActivityStatus;
}

const ACTIVITIES: ActivitySeed[] = [
  // ── Ăn uống ──────────────────────────────────────────────────────
  {
    hostIndex: 0,
    categoryName: 'Ăn uống',
    title: 'Ăn trưa bún bò Huế cùng nhau',
    location: 'Quán Bún Bò Huế - 45 Tạ Quang Bửu',
    purpose: 'Ăn trưa tụ tập sau buổi học sáng',
    description: 'Quán ngon, giá sinh viên. Mình hay đặt trước nên không lo hết chỗ. Ai thích bún bò thì tham gia nhé!',
    startDaysFromNow: 2,
    startHour: 11,
    startMinute: 30,
    durationHours: 1,
    deadlineDaysFromNow: 1,
    maxSlots: 5,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+bunbo_hust',
  },
  {
    hostIndex: 1,
    categoryName: 'Ăn uống',
    title: 'Food tour khu ẩm thực Bách Khoa',
    location: 'Tập trung cổng trường ĐH Bách Khoa - Số 1 Đại Cồ Việt',
    purpose: 'Khám phá các quán ăn ngon quanh trường',
    description: 'Mình sẽ dẫn mọi người đi thử 3-4 quán ăn nổi tiếng quanh trường. Từ bánh mì, bún, đến trà sữa. Phù hợp tân sinh viên chưa biết quán.',
    startDaysFromNow: 5,
    startHour: 17,
    startMinute: 30,
    durationHours: 2,
    deadlineDaysFromNow: 4,
    maxSlots: 8,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+foodtour_bk',
  },
  {
    hostIndex: 3,
    categoryName: 'Ăn uống',
    title: 'Lẩu tất niên cuối học kỳ',
    location: 'Nhà hàng Lẩu Nấm - 78 Giải Phóng',
    purpose: 'Kết thúc học kỳ căng thẳng bằng một bữa lẩu vui vẻ',
    description: 'Mình đặt bàn lẩu nấm + hải sản. Mỗi người góp khoảng 80-100k. Số lượng giới hạn nên đăng ký sớm nhé!',
    startDaysFromNow: 10,
    startHour: 18,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 8,
    maxSlots: 11,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+lau_tat_nien',
  },

  // ── Cà phê ───────────────────────────────────────────────────────
  {
    hostIndex: 1,
    categoryName: 'Cà phê',
    title: 'Cà phê + học bài sáng thứ 7',
    location: 'The Coffee House - 68 Trần Đại Nghĩa',
    purpose: 'Vừa học bài vừa chill cuối tuần',
    description: 'Mình thường đến lúc 8h sáng, ngồi đến trưa. Ai muốn cùng học bài, đọc sách hoặc đơn giản là cần không gian yên tĩnh thì ghé nhé.',
    startDaysFromNow: 3,
    startHour: 8,
    startMinute: 0,
    durationHours: 3,
    deadlineDaysFromNow: 2,
    maxSlots: 4,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+caphe_hoc_bai',
  },
  {
    hostIndex: 0,
    categoryName: 'Cà phê',
    title: 'Khám phá quán cà phê mới mở gần trường',
    location: 'Cộng Cà Phê - 152 Lê Duẩn',
    purpose: 'Tụ tập cuối tuần, review quán mới',
    description: 'Quán mới mở, decor vintage đẹp lắm. Mình muốn rủ mọi người đến thử xem sao. Menu đồ uống đa dạng, phù hợp ngồi talk chuyện.',
    startDaysFromNow: 7,
    startHour: 15,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 6,
    maxSlots: 6,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+caphe_moi',
  },

  // ── Học nhóm ─────────────────────────────────────────────────────
  {
    hostIndex: 2,
    categoryName: 'Học nhóm',
    title: 'Ôn thi Giải tích 1 - Tuần thi',
    location: 'Thư viện Tạ Quang Bửu - Phòng học nhóm B2',
    purpose: 'Ôn tập trước kỳ thi cuối kỳ môn Giải tích 1',
    description: 'Mình sẽ tổng hợp đề cương và giải các dạng bài tập trọng tâm. Ai còn yếu phần nào cứ nêu ra, cùng nhau giải quyết.',
    startDaysFromNow: 4,
    startHour: 14,
    startMinute: 0,
    durationHours: 3,
    deadlineDaysFromNow: 3,
    maxSlots: 6,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+giai_tich_hust',
  },
  {
    hostIndex: 3,
    categoryName: 'Học nhóm',
    title: 'Làm project môn Cơ sở dữ liệu',
    location: 'Phòng máy tính D9 - Tầng 3',
    purpose: 'Hoàn thiện đồ án CSDL trước deadline',
    description: 'Nhóm mình đang làm hệ thống quản lý thư viện. Cần thêm 2-3 bạn biết MySQL và có kinh nghiệm thiết kế ERD. Deadline nộp còn 2 tuần.',
    startDaysFromNow: 2,
    startHour: 19,
    startMinute: 0,
    durationHours: 3,
    deadlineDaysFromNow: 1,
    maxSlots: 3,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+csdl_project',
  },
  {
    hostIndex: 1,
    categoryName: 'Học nhóm',
    title: 'Ôn luyện TOEIC 700+ cùng nhau',
    location: 'Cà phê Highlands - Trần Đại Nghĩa',
    purpose: 'Luyện đề TOEIC, chia sẻ tài liệu ôn thi',
    description: 'Mình đang target 750 TOEIC. Mỗi buổi sẽ làm 1 đề full, sau đó review phần sai cùng nhau. Bring headphones nhé.',
    startDaysFromNow: 6,
    startHour: 9,
    startMinute: 0,
    durationHours: 3,
    deadlineDaysFromNow: 5,
    maxSlots: 5,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+toeic_hust',
  },

  // ── Lập trình ────────────────────────────────────────────────────
  {
    hostIndex: 0,
    categoryName: 'Lập trình',
    title: 'Hackathon mini 24h - Web App',
    location: 'Hội trường C2 - Tầng 1',
    purpose: 'Thử sức làm sản phẩm web hoàn chỉnh trong 24 giờ',
    description: 'Chia team 3-4 người, mỗi team build 1 web app từ đầu đến cuối. Stack tự chọn. Có mentor hỗ trợ. Kết thúc demo + chấm điểm. Giải thưởng: voucher phần mềm.',
    startDaysFromNow: 14,
    startHour: 8,
    startMinute: 0,
    deadlineDaysFromNow: 12,
    maxSlots: 20,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+hackathon_bk',
  },
  {
    hostIndex: 2,
    categoryName: 'Lập trình',
    title: 'Học React từ đầu - buổi 1',
    location: 'Zoom (link trong nhóm chat)',
    purpose: 'Cùng học React cho người mới bắt đầu',
    description: 'Mình sẽ hướng dẫn từ setup môi trường, JSX, component, state, props đến useEffect. Yêu cầu: biết HTML/CSS/JS cơ bản. Có record lại buổi học.',
    startDaysFromNow: 3,
    startHour: 20,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 2,
    maxSlots: 15,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+react_hust',
  },
  {
    hostIndex: 0,
    categoryName: 'Lập trình',
    title: 'Code dự án AI chatbot cùng nhau',
    location: 'Lab AI - Nhà C7, Tầng 5',
    purpose: 'Xây dựng chatbot dùng Python + LLM API',
    description: 'Mình đang nghiên cứu làm chatbot hỗ trợ sinh viên hỏi đáp nội quy trường. Cần bạn biết Python, hứng thú với AI/NLP. Dự án mở, push lên GitHub.',
    startDaysFromNow: 8,
    startHour: 14,
    startMinute: 0,
    durationHours: 4,
    deadlineDaysFromNow: 7,
    maxSlots: 4,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+ai_chatbot_hust',
  },

  // ── Tiếng Anh ────────────────────────────────────────────────────
  {
    hostIndex: 1,
    categoryName: 'Tiếng Anh',
    title: 'English Speaking Club - Thứ 3 hàng tuần',
    location: 'Phòng 203 - Nhà C1',
    purpose: 'Luyện nói tiếng Anh theo chủ đề mỗi tuần',
    description: 'Mỗi buổi có 1 chủ đề (tuần này: Technology & Society). Mình sẽ cho vocab + câu hỏi gợi ý trước. Không phán xét trình độ, quan trọng là dám nói!',
    startDaysFromNow: 2,
    startHour: 17,
    startMinute: 30,
    durationHours: 1,
    deadlineDaysFromNow: 1,
    maxSlots: 10,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+english_club_bk',
  },
  {
    hostIndex: 1,
    categoryName: 'Tiếng Anh',
    title: 'Luyện IELTS Writing Task 2 cùng nhau',
    location: 'Thư viện Tạ Quang Bửu - Tầng 4',
    purpose: 'Cải thiện band Writing lên 6.5+',
    description: 'Mỗi buổi sẽ viết 1 essay, sau đó peer-review. Mình có band 7.0 sẽ feedback chi tiết. Mang laptop hoặc giấy bút.',
    startDaysFromNow: 5,
    startHour: 14,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 4,
    maxSlots: 6,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+ielts_writing_hust',
  },

  // ── Bóng đá ──────────────────────────────────────────────────────
  {
    hostIndex: 0,
    categoryName: 'Bóng đá',
    title: 'Đá sân 5 tối thứ 6',
    location: 'Sân bóng Bách Khoa - Cổng phụ Giải Phóng',
    purpose: 'Xả stress cuối tuần, kết bạn mới',
    description: 'Đá giao hữu vui vẻ, không tính thắng thua. Mọi trình độ đều chào đón. Mang giày đinh hoặc giày bóng đá nhé. Chia đội random.',
    startDaysFromNow: 5,
    startHour: 19,
    startMinute: 0,
    durationHours: 1,
    deadlineDaysFromNow: 4,
    maxSlots: 9,
    gender: Gender.MALE,
    chatLink: 'https://t.me/+bongda_bk',
  },
  {
    hostIndex: 2,
    categoryName: 'Bóng đá',
    title: 'Xem chung kết Champions League tại quán',
    location: 'Sports Bar - 112 Bà Triệu',
    purpose: 'Xem bóng đá cùng hội bạn cho vui',
    description: 'Quán có màn hình lớn, đồ ăn vặt, giá ổn. Đặt chỗ trước nên cần xác nhận sớm. Ai cũng welcome, không nhất thiết phải hiểu bóng đá sâu.',
    startDaysFromNow: 9,
    startHour: 2,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 8,
    maxSlots: 12,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+xem_bong_da',
  },

  // ── Cầu lông ─────────────────────────────────────────────────────
  {
    hostIndex: 3,
    categoryName: 'Cầu lông',
    title: 'Đánh cầu lông buổi sáng thứ 7',
    location: 'Sân cầu lông Đại học Bách Khoa - Khu thể thao',
    purpose: 'Rèn luyện thể lực buổi sáng',
    description: 'Đặt sân từ 6h-8h. Mọi trình độ đều được. Ai chưa có vợt có thể mượn của mình. Sau đánh xong có thể ăn sáng cùng nhau luôn.',
    startDaysFromNow: 3,
    startHour: 6,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 2,
    maxSlots: 3,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+caulongbk',
  },

  // ── Gym ──────────────────────────────────────────────────────────
  {
    hostIndex: 0,
    categoryName: 'Gym',
    title: 'Gym buổi sáng - bắt đầu thói quen mới',
    location: 'Phòng tập California Fitness - Vincom Bà Triệu',
    purpose: 'Tập gym đều đặn mỗi sáng, có bạn tập cho có động lực',
    description: 'Mình đang theo chương trình tăng cơ. Nếu bạn mới bắt đầu, mình sẽ hướng dẫn bài tập cơ bản. Tập xong uống protein shake cùng nhau.',
    startDaysFromNow: 1,
    startHour: 6,
    startMinute: 30,
    durationHours: 1,
    deadlineDaysFromNow: 1,
    maxSlots: 3,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+gym_hust',
  },

  // ── Chạy bộ ──────────────────────────────────────────────────────
  {
    hostIndex: 2,
    categoryName: 'Chạy bộ',
    title: 'Chạy bộ sáng sớm quanh Hồ Tây',
    location: 'Tập trung cổng Hồ Tây - Đường Thanh Niên',
    purpose: 'Rèn sức bền, tận hưởng buổi sáng Hà Nội',
    description: 'Chạy khoảng 5km quanh Hồ Tây. Tốc độ vừa phải, ai cũng theo được. Sau chạy có thể ăn bánh mì, bún dọc mùng ven hồ. Bring áo thoáng mát.',
    startDaysFromNow: 2,
    startHour: 5,
    startMinute: 30,
    durationHours: 1,
    deadlineDaysFromNow: 1,
    maxSlots: 8,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+chaybo_hotay',
  },
  {
    hostIndex: 0,
    categoryName: 'Chạy bộ',
    title: 'Run club mỗi sáng thứ 2-4-6',
    location: 'Công viên Thống Nhất - Cổng Trần Nhân Tông',
    purpose: 'Duy trì thói quen chạy bộ đều đặn',
    description: 'Group chạy bộ nhẹ nhàng 3-7km. Có pace leader cho người mới. Hiện tại nhóm có 5 người, muốn thêm bạn mới. Yêu cầu: cam kết tham gia ít nhất 3 buổi/tuần.',
    startDaysFromNow: 1,
    startHour: 6,
    startMinute: 0,
    durationHours: 1,
    deadlineDaysFromNow: 1,
    maxSlots: 5,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+run_club_hn',
  },

  // ── Xem phim ─────────────────────────────────────────────────────
  {
    hostIndex: 3,
    categoryName: 'Xem phim',
    title: 'Xem Avengers: Secret Wars khi ra rạp',
    location: 'CGV Vincom Bà Triệu',
    purpose: 'Cùng nhau xem bom tấn Marvel mới nhất',
    description: 'Mình sẽ đặt vé trước suất 7h tối. Xem xong có thể đi ăn tối cùng. Ai muốn mua combo bắp + nước chung thì tiết kiệm hơn.',
    startDaysFromNow: 7,
    startHour: 19,
    startMinute: 0,
    durationHours: 3,
    deadlineDaysFromNow: 6,
    maxSlots: 7,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+xem_phim_marvel',
  },
  {
    hostIndex: 1,
    categoryName: 'Xem phim',
    title: 'Movie night - phim kinh dị tại ký túc',
    location: 'Phòng sinh hoạt chung KTX - Tầng 1 nhà A2',
    purpose: 'Tụ tập cuối tuần xem phim kinh dị',
    description: 'Tối thứ 6 chiếu phim kinh dị (lần này: The Conjuring 2). Bring snacks, chăn nếu sợ lạnh. Đèn tắt, màn hình to. Không spoil nhé!',
    startDaysFromNow: 6,
    startHour: 21,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 5,
    maxSlots: 10,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+movie_night_ktx',
  },

  // ── Karaoke ───────────────────────────────────────────────────────
  {
    hostIndex: 3,
    categoryName: 'Karaoke',
    title: 'Karaoke cuối tuần - hát hết mình',
    location: 'Karaoke Luxury - 45 Hàng Bài',
    purpose: 'Xả stress sau tuần học căng thẳng',
    description: 'Thuê phòng 3 tiếng, chia đều chi phí (khoảng 70k/người). Hát đủ thể loại từ nhạc trẻ đến bolero. Đặt phòng rồi nên cần xác nhận trước.',
    startDaysFromNow: 6,
    startHour: 19,
    startMinute: 0,
    durationHours: 3,
    deadlineDaysFromNow: 5,
    maxSlots: 7,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+karaoke_hust',
  },

  // ── Âm nhạc ──────────────────────────────────────────────────────
  {
    hostIndex: 1,
    categoryName: 'Âm nhạc',
    title: 'Jam session acoustic cuối tuần',
    location: 'Câu lạc bộ Âm nhạc - Nhà A1, Tầng 2',
    purpose: 'Chơi nhạc cụ cùng nhau, giao lưu âm nhạc',
    description: 'Mình chơi guitar, cần thêm vocal, keyboard, cajon. Nhạc indie Việt + nhạc nước ngoài. Không cần quá chuyên nghiệp, cần yêu nhạc và vui vẻ là được.',
    startDaysFromNow: 4,
    startHour: 15,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 3,
    maxSlots: 5,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+jamsession_bk',
  },
  {
    hostIndex: 2,
    categoryName: 'Âm nhạc',
    title: 'Đi xem concert indie Hà Nội',
    location: 'Manzi Art Space - 14 Phan Huy Ích',
    purpose: 'Thưởng thức âm nhạc indie live, gặp gỡ bạn mới',
    description: 'Concert của ban nhạc indie nổi tiếng Hà Nội. Vé 150k/người (mình mua chung). Không gian nhỏ ấm cúng, âm thanh tốt. Đến sớm để có chỗ đứng đẹp.',
    startDaysFromNow: 12,
    startHour: 20,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 10,
    maxSlots: 6,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+concert_indie_hn',
  },

  // ── Cờ vua ───────────────────────────────────────────────────────
  {
    hostIndex: 0,
    categoryName: 'Cờ vua',
    title: 'Giao lưu cờ vua - mọi trình độ',
    location: 'Phòng sinh hoạt CLB - Nhà C1 Tầng 3',
    purpose: 'Chơi cờ vua, rèn tư duy, kết bạn cùng sở thích',
    description: 'CLB cờ vua trường tổ chức buổi giao lưu hàng tuần. Có bảng xếp hạng Elo nội bộ. Người mới sẽ được hướng dẫn opening cơ bản. Bring board nếu có.',
    startDaysFromNow: 4,
    startHour: 16,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 3,
    maxSlots: 12,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+covua_bk',
  },

  // ── Board games ───────────────────────────────────────────────────
  {
    hostIndex: 3,
    categoryName: 'Board games',
    title: 'Ma sói - đêm phán xét',
    location: 'Board Game Cafe Meeple - 30 Hàng Buồm',
    purpose: 'Chơi Ma sói, rèn kỹ năng đọc tâm lý',
    description: 'Chơi Ma sói chuyên nghiệp với quản trò có kinh nghiệm. Có thêm các vai đặc biệt: Phù thủy, Thám tử, Bảo vệ. Mỗi người trả tiền đồ uống tại quán.',
    startDaysFromNow: 5,
    startHour: 19,
    startMinute: 0,
    durationHours: 3,
    deadlineDaysFromNow: 4,
    maxSlots: 11,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+masoi_bg',
  },
  {
    hostIndex: 1,
    categoryName: 'Board games',
    title: 'Catan + UNO + snacks tại nhà',
    location: 'Phòng 305 - KTX Bách Khoa, Nhà B3',
    purpose: 'Chơi board game chill cuối tuần',
    description: 'Mình có Catan, UNO, Uno Flip, Spot It. Mỗi người mang 1 món ăn vặt đến chia sẻ. Không gian thoải mái, casual. Chơi đến khi nào mệt thì thôi.',
    startDaysFromNow: 8,
    startHour: 14,
    startMinute: 0,
    durationHours: 4,
    deadlineDaysFromNow: 7,
    maxSlots: 7,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+boardgame_ktx',
  },

  // ── Nhiếp ảnh ─────────────────────────────────────────────────────
  {
    hostIndex: 1,
    categoryName: 'Nhiếp ảnh',
    title: 'Photo walk phố cổ Hà Nội',
    location: 'Tập trung Hồ Hoàn Kiếm - Gần Tháp Rùa',
    purpose: 'Chụp ảnh đường phố, học street photography',
    description: 'Đi bộ qua các phố cổ, chụp ảnh đời thường. Mình sẽ chia sẻ kỹ thuật bố cục, ánh sáng cho người mới. Dùng máy ảnh hoặc điện thoại đều được.',
    startDaysFromNow: 7,
    startHour: 7,
    startMinute: 0,
    durationHours: 3,
    deadlineDaysFromNow: 6,
    maxSlots: 8,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+photo_walk_hn',
  },
  {
    hostIndex: 1,
    categoryName: 'Nhiếp ảnh',
    title: 'Chụp kỷ yếu ngoại khoá cho sinh viên',
    location: 'Khuôn viên Đại học Bách Khoa Hà Nội',
    purpose: 'Chụp ảnh kỷ yếu đẹp với background trường',
    description: 'Mình nhận chụp ảnh kỷ yếu miễn phí trong khuôn viên trường. Đổi lại, bạn cho mình dùng ảnh để build portfolio. Outfit tự chọn, nên mặc trang trọng một chút.',
    startDaysFromNow: 11,
    startHour: 8,
    startMinute: 0,
    durationHours: 2,
    deadlineDaysFromNow: 10,
    maxSlots: 4,
    gender: Gender.ALL,
    chatLink: 'https://t.me/+kyeu_bk',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash('Password123', 10);

  // Tạo demo users
  console.log('Tạo demo users...');
  const users = await Promise.all(
    DEMO_USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: {
          email: u.email,
          studentId: u.studentId,
          passwordHash,
          name: u.name,
          gender: u.gender,
          faculty: u.faculty,
          schoolYear: u.schoolYear,
          bio: u.bio,
          isVerified: true,
        },
      }),
    ),
  );
  console.log(`  ✓ ${users.length} users`);

  // Load categories
  const categories = await prisma.activityCategory.findMany({
    select: { id: true, name: true },
  });
  const categoryMap = new Map(categories.map((c) => [c.name, c.id]));

  if (categoryMap.size === 0) {
    console.error('Chưa có categories trong DB. Chạy seed.ts trước.');
    process.exit(1);
  }

  // Tạo activities
  console.log('Tạo activities...');
  let created = 0;
  for (const a of ACTIVITIES) {
    const categoryId = categoryMap.get(a.categoryName);
    if (!categoryId) {
      console.warn(`  ⚠ Bỏ qua "${a.title}" — category "${a.categoryName}" không tồn tại`);
      continue;
    }

    const startTime = daysFromNow(a.startDaysFromNow, a.startHour, a.startMinute ?? 0);
    const endTime = a.durationHours
      ? new Date(startTime.getTime() + a.durationHours * 60 * 60 * 1000)
      : undefined;
    const deadline = daysFromNow(a.deadlineDaysFromNow, 23, 59);

    await prisma.activity.create({
      data: {
        hostId: users[a.hostIndex].id,
        categoryId,
        title: a.title,
        location: a.location,
        purpose: a.purpose,
        description: a.description,
        startTime,
        endTime,
        deadline,
        maxSlots: a.maxSlots,
        gender: a.gender,
        chatLink: a.chatLink,
        status: a.status ?? ActivityStatus.OPEN,
      },
    });

    console.log(`  ✓ ${a.title}`);
    created++;
  }

  console.log(`\nDone. Đã tạo ${created} hoạt động.`);
}

main()
  .catch((err) => {
    console.error('Seed activities failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
