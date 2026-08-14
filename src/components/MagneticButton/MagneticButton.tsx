import type { ReactNode } from 'react';
import { useMagnetic } from '../../lib/useMagnetic';
import s from './MagneticButton.module.css';

type Props = {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'outline' | 'solid' | 'ghost';
  size?: 'md' | 'lg';
  strength?: number;
  className?: string;
  cursorLabel?: string;
  ariaLabel?: string;
};

export default function MagneticButton({
  children,
  href,
  onClick,
  variant = 'outline',
  size = 'md',
  strength = 0.22,
  className = '',
  cursorLabel,
  ariaLabel,
}: Props) {
  const ref = useMagnetic<HTMLAnchorElement & HTMLButtonElement>({ strength });

  const classes = [
    s.root,
    variant === 'solid' && s.solid,
    variant === 'ghost' && s.ghost,
    size === 'lg' && s.lg,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const shared = {
    ref,
    className: classes,
    'aria-label': ariaLabel,
    'data-cursor': cursorLabel ? 'drag' : 'hover',
    'data-cursor-label': cursorLabel,
  } as const;

  const inner = (
    <span className={s.label} data-magnetic-child>
      {children}
    </span>
  );

  if (href) {
    const external = href.startsWith('http');
    return (
      <a
        {...shared}
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer noopener' : undefined}
      >
        {inner}
      </a>
    );
  }

  return (
    <button {...shared} type="button" onClick={onClick}>
      {inner}
    </button>
  );
}
