import React, { useEffect, useId, useRef, useState } from 'react'
import css from './tooltip.module.css'
import cx from '@course/cx'

type TooltipProps = {
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  children: React.ReactNode
  content: React.ReactNode
  boundary?: React.RefObject<HTMLElement | null> | HTMLElement
}

const positions = {
  top: css.top,
  bottom: css.bottom,
  left: css.left,
  right: css.right,
} as const

type TCandidate = { position: 'top' | 'bottom' | 'left' | 'right'; x: number; y: number }

/**
 * Helper: determine best position when position='auto'
 * - Get bounding rects for tooltip and trigger
 * - Check candidates (top, right, bottom, left) against boundary
 * - Return first position that fits, or 'top' as fallback
 */
const getAutoPosition = (
  tooltipRect: DOMRect,
  triggerRect: DOMRect,
  boundaryRect: { left: number; top: number; right: number; bottom: number },
): 'top' | 'bottom' | 'left' | 'right' => {
  const [t, c, b] = [tooltipRect, triggerRect, boundaryRect]

  const candidates: TCandidate[] = [
    { position: 'top', x: c.left, y: c.top - t.height },
    { position: 'right', x: c.right, y: c.top },
    { position: 'bottom', x: c.left, y: c.bottom },
    { position: 'left', x: c.left - t.width, y: c.top },
  ]

  const fit = ({ x, y }: TCandidate) => {
    const isFitHor = x >= b.left && Math.ceil(x + t.width) <= b.right
    const isFitVer = y >= b.top && Math.ceil(y + t.height) <= b.bottom

    return isFitHor && isFitVer
  }

  const candidate = candidates.find(fit)

  return candidate?.position ?? 'top'
}

/**
 * Expected input:
 * <Tooltip position="top" content="Tooltip text">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * Optional: position="auto" with boundary={ref} for auto-positioning
 *
 * Step 1: Implement Tooltip component
 * - Track isVisible with useState (default: false)
 * - Track tooltipPosition with useState (default: position or 'top')
 * - Create refs for tooltip element and container element
 * - Use useEffect to compute auto-position when visible and position='auto'
 * - Generate unique id with useId() for aria-describedby
 * - Implement show/hide handlers for mouse enter/leave, focus/blur
 * - Handle Escape key to hide tooltip
 * - Render:
 *   - Container div with mouse/focus/keyboard handlers and css.container
 *   - Children inside the container
 *   - When visible: tooltip div with role="tooltip", id, ref, and position class
 *   - Use aria-describedby on container pointing to tooltip id when visible
 */
export function Tooltip({ children, content, position = 'top', boundary }: TooltipProps) {
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>(position !== 'auto' ? position : 'top');
    
    const tooltipRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const id = useId();

    const onMouseEnter = () => {
      setIsVisible(true);
    }
    
    const onMouseLeave = () => {
      setIsVisible(false);
    }

    const onFocusIn = () => {
      setIsVisible(true);
    }

    const onFocusOut = () => {
      setIsVisible(false);
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsVisible(false);
      }
    }

    useEffect(() => {
      if (position !== 'auto' || !isVisible || !tooltipRef.current || !containerRef.current) return;

      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      let boundaryRect: { left: number; top: number; right: number; bottom: number } = {
        left: 0,
        top: 0,
        right: window.innerWidth,
        bottom: window.innerHeight,
      };

      if (boundary) {
        if (boundary instanceof HTMLElement) {
          boundaryRect = boundary.getBoundingClientRect();
        } else {
          boundaryRect = boundary.current?.getBoundingClientRect() ?? boundaryRect;
        }
      }

      const autoPosition = getAutoPosition(tooltipRect, containerRect, boundaryRect)   

      setTooltipPosition(autoPosition);
        
    }, [isVisible, position]);
    
  return (
    <div 
        ref={containerRef} 
        onMouseEnter={onMouseEnter} 
        onMouseLeave={onMouseLeave} 
        onFocus={onFocusIn} 
        onBlur={onFocusOut} 
        onKeyDown={onKeyDown}
        className={cx(css.container)}
        aria-describedby={isVisible ? id : undefined}
    >
      {children}
      {isVisible && (
        <div ref={tooltipRef} role="tooltip" id={id} className={cx(css.tooltip, positions[tooltipPosition])}>
          {content}
        </div>
      )}
    </div>
  )
}
