import css from './gallery.module.css'
import flex from '@course/styles'
import cx from '@course/cx'
import { useState, useEffect, useCallback } from 'react'

type TGalleryProps = {
  images: string[]
}

/**
 * Expected input:
 * <Gallery images={['url1.jpg', 'url2.jpg', 'url3.jpg']} />
 */
export const Gallery = ({ images }: TGalleryProps) => {
  // Step 1: Set up state
  // - currentIndex (number, default 0) to track the active slide
  const [currentIndex, setCurrentIndex] = useState(0)

  // Step 2: Create navigation handlers with useCallback
  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1))
  }, [images.length])

  // Step 3: Add keyboard navigation with useEffect
  // - Listen for 'keydown' on window
  // - ArrowLeft → handlePrev, ArrowRight → handleNext
  // - Clean up the event listener on unmount

  // Step 4: Handle empty state
  if (images.length === 0) return <div>Nothing to show</div>;

  // Step 5: Render the gallery
  // - <section> container with positioning classes
  // - Prev button (disabled when currentIndex === 0), positioned absolute left, aria-label="Previous image"
  // - <ul> with transform: translateX(-currentIndex * 100%) for sliding
  // - Each <li> contains an <img>; use lazy loading: src={currentIndex + 2 >= index ? image : undefined}
  // - Next button (disabled when currentIndex === images.length - 1), positioned absolute right, aria-label="Next image"
  // - Dot indicators: one <button> per image, active dot gets css.dotActive class
  //   - onClick sets currentIndex to that dot's index, aria-label="Go to image {index + 1}"

  const style = {
    transform: `translateX(-${currentIndex * 100}%)`
  }

  return (
    <section className={cx(flex.pRel, css.gallery)}>
      <button onClick={handlePrev} disabled={currentIndex === 0} className={cx(css.button)}>Prev</button>

      <ul className={cx(css.image__list)} style={style}>
        {images.map((image, index) => (
          <li key={index} className={cx(css.image)}>
            <img src={image} alt={`Slide ${index + 1}`} />
          </li>
        ))}
      </ul>

      <button onClick={handleNext} disabled={currentIndex === images.length - 1} className={cx(css.button)}>Next</button>
    </section>
  )
}
