import { useEffect, useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { FaStar } from 'react-icons/fa'
import { FiCheck, FiMessageSquare, FiSend, FiX } from 'react-icons/fi'
import { track } from '@vercel/analytics/react'
import axios from 'axios'
import { trackEvent } from '../../utils/analytics'
import { BASE_URL } from '../../pages/config'
import './feedback.css'

const FEEDBACK_DELAY = 20_000
const FEEDBACK_STORAGE_KEY = 'parabola_feedback_submitted'
const FEEDBACK_SESSION_KEY = 'parabola_feedback_dismissed'

const feedbackTopics = [
  { id: 'accurate', label: 'Ölçü tövsiyəsi dəqiqdir', tone: 'positive' },
  { id: 'easy', label: 'İstifadəsi rahatdır', tone: 'positive' },
  { id: 'design', label: 'Dizaynı bəyəndim', tone: 'positive' },
  { id: 'inaccurate', label: 'Ölçü nəticəsi uyğun deyil', tone: 'problem' },
  { id: 'slow', label: 'Sayt yavaşdır', tone: 'problem' },
  { id: 'catalog', label: 'Məhsul tapmaq çətindir', tone: 'problem' },
  { id: 'technical', label: 'Texniki problem var', tone: 'problem' },
]

const getStoredValue = (storage, key) => {
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

const setStoredValue = (storage, key, value) => {
  try {
    storage.setItem(key, value)
  } catch {
    // The widget should remain usable even when browser storage is unavailable.
  }
}

function FeedbackWidget({ isSignedIn = false }) {
  const titleId = useId()
  const descriptionId = useId()
  const [isOpen, setIsOpen] = useState(false)
  const [hasPrompted, setHasPrompted] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [selectedTopics, setSelectedTopics] = useState([])
  const [comment, setComment] = useState('')
  const [validationMessage, setValidationMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const alreadySubmitted = getStoredValue(window.localStorage, FEEDBACK_STORAGE_KEY)
    const dismissedThisSession = getStoredValue(window.sessionStorage, FEEDBACK_SESSION_KEY)

    if (alreadySubmitted || dismissedThisSession) return undefined

    const timer = window.setTimeout(() => {
      setHasPrompted(true)
      setIsOpen(true)
    }, FEEDBACK_DELAY)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        setHasPrompted(true)
        setStoredValue(window.sessionStorage, FEEDBACK_SESSION_KEY, 'true')
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleClose = () => {
    setIsOpen(false)
    setHasPrompted(true)
    setStoredValue(window.sessionStorage, FEEDBACK_SESSION_KEY, 'true')
  }

  const handleOpen = () => {
    setValidationMessage('')
    setIsOpen(true)
  }

  const handleRating = (value) => {
    setRating(value)
    setValidationMessage('')
  }

  const toggleTopic = (topicId) => {
    setSelectedTopics((current) => (
      current.includes(topicId)
        ? current.filter((id) => id !== topicId)
        : [...current, topicId]
    ))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!rating) {
      setValidationMessage('Rəyinizi göndərmək üçün ulduz sayını seçin.')
      return
    }

    const topicLabels = feedbackTopics
      .filter((topic) => selectedTopics.includes(topic.id))
      .map((topic) => topic.label)
    const cleanComment = comment.trim()
    const feedbackDetails = [
      `topics=${selectedTopics.join(',') || 'none'}`,
      `comment=${cleanComment || 'none'}`,
      `page=${window.location.pathname}`,
      `signed_in=${isSignedIn}`,
    ].join('; ').slice(0, 255)

    setIsSubmitting(true)
    setValidationMessage('')

    try {
      await axios.post(`${BASE_URL}/api/v1/feedback`, {
        rating,
        topics: selectedTopics,
        comment: cleanComment,
        pagePath: window.location.pathname,
        signedIn: isSignedIn,
      }, { timeout: 30_000 })

      try {
        track('Feedback submitted', { rating, details: feedbackDetails })
        trackEvent(
          'Feedback',
          'submit_feedback',
          topicLabels.join(', ') || 'Mövzu seçilməyib',
          rating,
          {
            feedback_rating: rating,
            feedback_topics: selectedTopics.join(',') || 'none',
            feedback_comment: cleanComment || 'none',
            page_path: window.location.pathname,
            signed_in: isSignedIn,
          },
        )
      } catch (error) {
        console.warn('Feedback analytics event could not be sent:', error)
      }

      setStoredValue(window.localStorage, FEEDBACK_STORAGE_KEY, new Date().toISOString())
      setStoredValue(window.sessionStorage, FEEDBACK_SESSION_KEY, 'true')
      setIsSubmitted(true)
      window.setTimeout(() => setIsOpen(false), 1800)
    } catch (error) {
      console.warn('Feedback could not be saved:', error)
      setValidationMessage('Rəy göndərilmədi. İnternet bağlantınızı yoxlayıb yenidən cəhd edin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!hasPrompted || (!isOpen && isSubmitted)) return null

  return createPortal(
    <>
      {!isOpen && (
        <button className="feedback-launcher" type="button" onClick={handleOpen}>
          <FiMessageSquare aria-hidden="true" />
          <span>Rəy bildir</span>
        </button>
      )}

      {isOpen && (
        <aside
          className="feedback-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          {isSubmitted ? (
            <div className="feedback-success" role="status">
              <span className="feedback-success-icon" aria-hidden="true">
                <FiCheck />
              </span>
              <p className="feedback-kicker">Rəyiniz qeydə alındı</p>
              <h2 id={titleId}>Təşəkkür edirik</h2>
              <p>Paylaşdığınız fikir Parabola-nı daha yaxşı etməyimizə kömək edəcək.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="feedback-header">
                <div>
                  <p className="feedback-kicker">Fikirləriniz bizim üçün dəyərlidir</p>
                  <h2 id={titleId}>Parabola təcrübəniz necədir?</h2>
                  <p id={descriptionId}>Bir neçə saniyəyə fikrinizi bizimlə paylaşın.</p>
                </div>
                <button
                  className="feedback-close"
                  type="button"
                  onClick={handleClose}
                  aria-label="Rəy pəncərəsini bağla"
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>

              <fieldset className="feedback-fieldset">
                <legend>Ümumi qiymətləndirmə</legend>
                <div className="feedback-stars" onMouseLeave={() => setHoveredRating(0)}>
                  {[1, 2, 3, 4, 5].map((value) => {
                    const isActive = value <= (hoveredRating || rating)
                    return (
                      <button
                        key={value}
                        className={isActive ? 'feedback-star active' : 'feedback-star'}
                        type="button"
                        onClick={() => handleRating(value)}
                        onMouseEnter={() => setHoveredRating(value)}
                        aria-label={`${value} ulduz`}
                        aria-pressed={rating === value}
                      >
                        <FaStar aria-hidden="true" />
                      </button>
                    )
                  })}
                  <span className="feedback-rating-copy" aria-live="polite">
                    {rating ? `${rating} / 5` : 'Ulduz seçin'}
                  </span>
                </div>
              </fieldset>

              <fieldset className="feedback-fieldset">
                <legend>Nəyi qeyd etmək istərdiniz?</legend>
                <div className="feedback-topics">
                  {feedbackTopics.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id)
                    return (
                      <button
                        key={topic.id}
                        className={`feedback-topic ${topic.tone}${isSelected ? ' selected' : ''}`}
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        aria-pressed={isSelected}
                      >
                        {isSelected && <FiCheck aria-hidden="true" />}
                        {topic.label}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <label className="feedback-comment-label" htmlFor="feedback-comment">
                Əlavə rəy <span>(istəyə bağlı)</span>
              </label>
              <div className="feedback-comment-wrap">
                <textarea
                  id="feedback-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Təcrübənizi daha yaxşı anlamağımız üçün fikrinizi yazın..."
                  maxLength={250}
                  rows={3}
                />
                <span>{comment.length}/250</span>
              </div>

              {validationMessage && (
                <p className="feedback-validation" role="alert">{validationMessage}</p>
              )}

              <div className="feedback-actions">
                <button className="feedback-later" type="button" onClick={handleClose} disabled={isSubmitting}>
                  Sonra
                </button>
                <button className="feedback-submit" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
                  <span>{isSubmitting ? 'Göndərilir...' : 'Rəyi göndər'}</span>
                  <FiSend aria-hidden="true" />
                </button>
              </div>
            </form>
          )}
        </aside>
      )}
    </>,
    document.body,
  )
}

export default FeedbackWidget
