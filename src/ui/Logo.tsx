import type { SVGProps } from 'react'
import { cn } from '../lib/cn'

type LogoProps = SVGProps<SVGSVGElement> & {
  /** Width in pixels; height follows the logo's aspect ratio. */
  size?: number
  /** `'dark'` sits on dark backgrounds (light fill), `'light'` on light backgrounds (dark fill). */
  variant?: 'dark' | 'light'
}

const ASPECT_RATIO = 902 / 935

/** The Tessera mark, matching the product's modus `Logo`. */
export function Logo({ size = 48, variant = 'dark', className, ...props }: LogoProps) {
  const color = variant === 'light' ? '#1A1A1A' : '#F4F4F4'
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size * ASPECT_RATIO}
      viewBox="0 0 902 935"
      className={cn('shrink-0', className)}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
      {...props}
    >
      <path d="M654.91 532.57L505.26 682.22V913.65L886.34 532.57H654.91Z" fill={color} />
      <path d="M853.61 423.47L450.71 20.5801L47.8198 423.47H279.25L450.71 252.01L622.18 423.47H853.61Z" fill={color} />
      <path d="M15.0801 532.57L396.16 913.65V682.22L246.51 532.57H15.0801Z" fill={color} />
    </svg>
  )
}
