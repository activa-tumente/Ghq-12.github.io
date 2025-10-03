import { useEffect, useRef } from 'react'

/**
 * ScreenReaderAnnouncer component for announcing dynamic content changes to screen readers
 * Uses ARIA live regions to provide real-time updates
 */
const ScreenReaderAnnouncer = ({ message, priority = 'polite', clearAfter = 3000 }) => {
  const announcerRef = useRef(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (message && announcerRef.current) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Set the message
      announcerRef.current.textContent = message

      // Clear the message after specified time to prevent repetition
      if (clearAfter > 0) {
        timeoutRef.current = setTimeout(() => {
          if (announcerRef.current) {
            announcerRef.current.textContent = ''
          }
        }, clearAfter)
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [message, clearAfter])

  return (
    <div
      ref={announcerRef}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  )
}

/**
 * Hook for managing screen reader announcements
 * Returns a function to announce messages
 */
export const useScreenReaderAnnouncer = () => {
  const announcerRef = useRef(null)

  const announce = (message, priority = 'polite') => {
    if (announcerRef.current) {
      // Clear existing content first
      announcerRef.current.textContent = ''
      
      // Use setTimeout to ensure the clear happens before the new message
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = message
          announcerRef.current.setAttribute('aria-live', priority)
        }
      }, 10)
    }
  }

  const AnnouncerComponent = () => (
    <div
      ref={announcerRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      role="status"
    />
  )

  return { announce, AnnouncerComponent }
}

export default ScreenReaderAnnouncer