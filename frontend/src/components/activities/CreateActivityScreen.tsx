import { type FormEvent, useEffect, useRef, useState } from 'react'
import { ButtonSpinner } from '../common/LoadingState'
import { getNowDateTimeLocalMin, getTodayDateMin } from '../../lib/validateActivity'
import type { Banner, CreateActivityForm, FieldErrors } from '../../types/activity'

const CATEGORY_ICONS: Record<string, string> = {
  'Ăn uống': '🍜',
  'Cà phê': '☕',
  'Học nhóm': '📚',
  'Lập trình': '💻',
  'Tiếng Anh': '🗣️',
  'Bóng đá': '⚽',
  'Cầu lông': '🏸',
  'Gym': '🏋️',
  'Chạy bộ': '🏃',
  'Xem phim': '🎬',
  'Karaoke': '🎤',
  'Âm nhạc': '🎵',
  'Cờ vua': '♟️',
  'Board games': '🎲',
  'Nhiếp ảnh': '📸',
}

type CreateActivityScreenProps = {
  form: CreateActivityForm
  errors: FieldErrors
  loading: boolean
  banner: Banner
  categories: string[]
  submitLabel?: string
  loadingLabel?: string
  onChange: <K extends keyof CreateActivityForm>(field: K, value: CreateActivityForm[K]) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function CreateActivityScreen({
  form,
  errors,
  loading,
  banner,
  categories,
  submitLabel = 'Tạo hoạt động',
  loadingLabel = 'Đang tạo...',
  onChange,
  onSubmit,
  onCancel,
}: CreateActivityScreenProps) {
  const descriptionCount = form.description.length
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!form.imageFile) {
      setImagePreviewUrl(null)
      return
    }

    const nextPreviewUrl = URL.createObjectURL(form.imageFile)
    setImagePreviewUrl(nextPreviewUrl)

    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [form.imageFile])

  const handleRemoveImage = () => {
    onChange('imageFile', null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <form className="create-form" onSubmit={onSubmit} noValidate>
      {banner && (
        <div className={`banner banner-${banner.tone}`} role="alert" aria-live="polite">
          {banner.text}
        </div>
      )}

      <section className="create-section">
        <div className="create-section-head">
          <span className="create-section-badge">Bước 1</span>
          <h2>Loại hoạt động</h2>
          <p>Chọn nhóm phù hợp để bạn bè dễ tìm thấy hoạt động của bạn.</p>
        </div>

        <div className="category-grid" role="group" aria-label="Loại hoạt động">
          {categories.map((category) => {
            const selected = form.category === category
            return (
              <button
                key={category}
                type="button"
                className={`category-card ${selected ? 'is-selected' : ''}`}
                aria-pressed={selected}
                onClick={() => onChange('category', category)}
              >
                <span className="category-card-icon" aria-hidden>
                  {CATEGORY_ICONS[category] ?? '✨'}
                </span>
                <span className="category-card-label">{category}</span>
              </button>
            )
          })}
        </div>
        {errors.category && <small className="field-error create-section-error">{errors.category}</small>}
      </section>

      <section className="create-section">
        <div className="create-section-head">
          <span className="create-section-badge">Bước 2</span>
          <h2>Thông tin cơ bản</h2>
        </div>

        <div className="create-field-grid create-field-grid-2">
          <label className="field">
            <span>Tên hoạt động</span>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onChange('title', e.target.value)}
              placeholder="VD: Ăn trưa tại Canteen Bách Khoa"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && <small className="field-error">{errors.title}</small>}
          </label>

          <label className="field">
            <span>Địa điểm</span>
            <input
              type="text"
              value={form.location}
              onChange={(e) => onChange('location', e.target.value)}
              placeholder="VD: Tòa Hội Sinh viên, tầng 2"
              aria-invalid={Boolean(errors.location)}
            />
            {errors.location && <small className="field-error">{errors.location}</small>}
          </label>
        </div>
      </section>

      <section className="create-section">
        <div className="create-section-head">
          <span className="create-section-badge">Bước 3</span>
          <h2>Hình ảnh</h2>
        </div>

        <div className="field create-image-field">
          <span>Ảnh hoạt động (tùy chọn)</span>
          <label className={`create-image-upload ${imagePreviewUrl ? 'has-preview' : ''}`}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => onChange('imageFile', e.target.files?.[0] ?? null)}
              aria-invalid={Boolean(errors.imageFile)}
            />
            {imagePreviewUrl ? (
              <img src={imagePreviewUrl} alt="" />
            ) : (
              <span className="create-image-placeholder">
                <strong>Chọn ảnh</strong>
                <small>JPG, PNG, WEBP hoặc GIF · tối đa 5MB</small>
              </span>
            )}
          </label>
          <div className="field-footer">
            {errors.imageFile ? <small className="field-error">{errors.imageFile}</small> : <span />}
            {form.imageFile && (
              <button type="button" className="create-image-remove" onClick={handleRemoveImage}>
                Gỡ ảnh
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="create-section">
        <div className="create-section-head">
          <span className="create-section-badge">Bước 4</span>
          <h2>Thời gian</h2>
        </div>

        <div className="create-field-grid create-field-grid-3">
          <label className="field">
            <span>Ngày</span>
            <input
              type="date"
              min={getTodayDateMin()}
              value={form.date}
              onChange={(e) => onChange('date', e.target.value)}
              aria-invalid={Boolean(errors.date)}
            />
            {errors.date && <small className="field-error">{errors.date}</small>}
          </label>

          <label className="field">
            <span>Giờ bắt đầu</span>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => onChange('startTime', e.target.value)}
              aria-invalid={Boolean(errors.startTime)}
            />
            {errors.startTime && <small className="field-error">{errors.startTime}</small>}
          </label>

          <label className="field">
            <span>Giờ kết thúc (tùy chọn)</span>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => onChange('endTime', e.target.value)}
              aria-invalid={Boolean(errors.endTime)}
            />
            {errors.endTime && <small className="field-error">{errors.endTime}</small>}
          </label>
        </div>
      </section>

      <section className="create-section">
        <div className="create-section-head">
          <span className="create-section-badge">Bước 5</span>
          <h2>Chi tiết tham gia</h2>
        </div>

        <div className="create-field-grid create-field-grid-2">
          <label className="field">
            <span>Số người tối đa</span>
            <input
              type="number"
              min={1}
              step={1}
              value={form.maxSlots}
              onChange={(e) => onChange('maxSlots', e.target.value)}
              placeholder="VD: 6"
              aria-invalid={Boolean(errors.maxSlots)}
            />
            {errors.maxSlots && <small className="field-error">{errors.maxSlots}</small>}
            <small className="field-hint">Không tính bạn (người tổ chức)</small>
          </label>

          <label className="field">
            <span>Mục đích</span>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => onChange('purpose', e.target.value)}
              placeholder="VD: Gặp gỡ bạn mới, ôn thi..."
              aria-invalid={Boolean(errors.purpose)}
            />
            {errors.purpose && <small className="field-error">{errors.purpose}</small>}
          </label>

          <label className="field">
            <span>Hạn đăng ký</span>
            <input
              type="datetime-local"
              min={getNowDateTimeLocalMin()}
              value={form.deadline}
              onChange={(e) => onChange('deadline', e.target.value)}
              aria-invalid={Boolean(errors.deadline)}
            />
            {errors.deadline && <small className="field-error">{errors.deadline}</small>}
          </label>

          <label className="field">
            <span>Link nhóm Telegram / Zalo / Messenger</span>
            <input
              type="url"
              value={form.chatLink}
              onChange={(e) => onChange('chatLink', e.target.value)}
              placeholder="https://t.me/..."
              aria-invalid={Boolean(errors.chatLink)}
            />
            {errors.chatLink && <small className="field-error">{errors.chatLink}</small>}
          </label>

          <div className="field create-gender-field">
            <span>Yêu cầu về giới tính</span>
            <div className="choice-row choice-row-gender" role="group" aria-label="Yêu cầu về giới tính">
              <button
                type="button"
                className={`choice-pill choice-pill-gender ${form.gender === 'male' ? 'is-selected' : ''}`}
                aria-pressed={form.gender === 'male'}
                onClick={() => onChange('gender', 'male')}
              >
                Nam
              </button>
              <button
                type="button"
                className={`choice-pill choice-pill-gender ${form.gender === 'female' ? 'is-selected' : ''}`}
                aria-pressed={form.gender === 'female'}
                onClick={() => onChange('gender', 'female')}
              >
                Nữ
              </button>
              <button
                type="button"
                className={`choice-pill choice-pill-gender ${form.gender === 'all' ? 'is-selected' : ''}`}
                aria-pressed={form.gender === 'all'}
                onClick={() => onChange('gender', 'all')}
              >
                Không yêu cầu
              </button>
            </div>
            {errors.gender && <small className="field-error">{errors.gender}</small>}
          </div>
        </div>
      </section>

      <section className="create-section">
        <div className="create-section-head">
          <span className="create-section-badge">Bước 6</span>
          <h2>Mô tả chi tiết</h2>
        </div>

        <label className="field">
          <span>Nội dung (tùy chọn)</span>
          <textarea
            rows={5}
            maxLength={500}
            value={form.description}
            onChange={(e) => onChange('description', e.target.value)}
            placeholder="Thêm quy tắc, dress code, hoặc ghi chú cho người tham gia..."
            aria-invalid={Boolean(errors.description)}
          />
          <div className="field-footer">
            {errors.description ? <small className="field-error">{errors.description}</small> : <span />}
            <span className="char-count">{descriptionCount}/500</span>
          </div>
        </label>
      </section>

      <div className="create-form-actions">
        <button type="button" className="create-cancel-button" onClick={onCancel} disabled={loading}>
          Hủy bỏ
        </button>
        <button type="submit" className="primary-button create-submit-button" disabled={loading}>
          {loading ? <ButtonSpinner label={loadingLabel} /> : submitLabel}
        </button>
      </div>
    </form>
  )
}
