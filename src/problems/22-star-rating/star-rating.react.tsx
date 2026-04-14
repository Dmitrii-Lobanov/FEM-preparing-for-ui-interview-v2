import css from './star-rating.module.css'
import flex from '@course/styles'
import cx from '@course/cx'
import { useState } from 'react'

/**
 * Expected input:
 * {
 *   value: number,
 *   onChange: (value: number) => void,
 *   readonly?: boolean
 * }
 *
 * Steps to complete:
 * 1. Init constructor - define props type with value, onChange, readonly
 * 2. Provide template - render star buttons with proper attributes
 * 3. Handle click event - delegate click to update value
 * 4. Add ARIA attributes:
 *    Container:
 *    - role="radiogroup" — groups related radio-like controls so screen readers announce "radiogroup" when entering
 *    - aria-label="Star Rating" — provides an accessible name for the group (no visible label exists)
 *    - aria-readonly="true/false" — tells assistive tech whether the rating can be changed
 *    Each star button:
 *    - role="radio" — each star acts as a radio option within the group
 *    - aria-checked="true/false" — indicates which star is currently selected
 *    - aria-label="N Star(s)" — provides a meaningful label (e.g. "3 Stars") instead of just the emoji
 * 5. Add CSS styles for stars
 */

const STAR = '⭐️'
const STARS_COUNT = 5
type TProps = {
  value: number
  onChange: (value: number) => void
  readonly?: boolean
}

const Star = ({value, onChange}: {value: number, onChange: (value: number) => void, readonly?: boolean}) => {
  return (
    Array.from({ length: STARS_COUNT }, (_, index) => {
      return (
        <button
          key={index}
          role="radio"
          aria-selected={value <= index + 1}
          aria-label={`Rating of ${index + 1}`}
          data-rating={index + 1}
          data-checked={value >= index + 1}
          className={cx(css.star)}
          onClick={() => onChange(index + 1)}
        >
          {STAR}
        </button>
      )
    })
  )
}

export const StarRating = (props: TProps) => {
  const [rating, setRating] = useState(props.value)

  return <div>
    <Star value={rating} onChange={setRating} />
    <p>Star rating: {rating}</p>
  </div>
}
