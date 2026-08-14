import { useEffect, useState } from 'react';

type Props = {
  /** IANA zone. Omit for the visitor's own timezone. */
  timeZone?: string;
  withSeconds?: boolean;
  withZone?: boolean;
  className?: string;
};

const zoneLabel = (tz?: string) => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
};

/** Ticking mono clock. Defaults to the visitor's timezone. */
export default function LiveClock({
  timeZone,
  withSeconds = true,
  withZone = false,
  className,
}: Props) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      ...(withSeconds ? { second: '2-digit' as const } : {}),
      hour12: false,
    });

    const tick = () => setTime(fmt.format(new Date()));
    tick();

    // Align to the next whole second so the digits flip cleanly.
    let interval: number;
    const timeout = window.setTimeout(
      () => {
        tick();
        interval = window.setInterval(tick, 1000);
      },
      1000 - (Date.now() % 1000),
    );

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [timeZone, withSeconds]);

  return (
    <time className={className} suppressHydrationWarning>
      {time}
      {withZone && time ? ` ${zoneLabel(timeZone)}` : ''}
    </time>
  );
}
