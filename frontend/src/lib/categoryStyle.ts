const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  'Ăn uống':   { bg: '#fff0e6', color: '#e05d28' },
  'Cà phê':    { bg: '#fff5e6', color: '#a0522d' },
  'Học nhóm':  { bg: '#e8f2ff', color: '#2b6cb0' },
  'Lập trình': { bg: '#eef0ff', color: '#3730a3' },
  'Tiếng Anh': { bg: '#e6f7f5', color: '#0d9488' },
  'Bóng đá':   { bg: '#e7faf0', color: '#16a34a' },
  'Cầu lông':  { bg: '#edf7e8', color: '#3a7d44' },
  'Gym':       { bg: '#fff0ec', color: '#c0392b' },
  'Chạy bộ':  { bg: '#fff8e8', color: '#d97706' },
  'Xem phim':  { bg: '#f5f0ff', color: '#7c3aed' },
  'Karaoke':   { bg: '#fff0f5', color: '#db2777' },
  'Âm nhạc':   { bg: '#f3ecff', color: '#7c4dbd' },
  'Cờ vua':    { bg: '#f0f4ff', color: '#1e40af' },
  'Board games': { bg: '#f0ebff', color: '#6d28d9' },
  'Nhiếp ảnh': { bg: '#f5f1ec', color: '#78716c' },
}

const DEFAULT_STYLE = { bg: '#fff0e6', color: '#e05d28' }

export function getCategoryStyle(categoryName: string) {
  return CATEGORY_STYLES[categoryName] ?? DEFAULT_STYLE
}
