import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
  type MotionValue,
} from 'motion/react';
import { useEffect, useRef, useState } from 'react';

// Layout
const CARD_STEP_X = 170;
const CARD_RISE_Y = 80;
const CARD_DEPTH_Z = 200;
const PAST_EXIT_X = 420;

// Input sensitivity
const DRAG_PX_PER_UNIT = 170;
const WHEEL_PX_PER_UNIT = 140;
const SNAP_DELAY_MS = 130;
const FLING_PROJECTION_S = 0.15;

// Spring physics for smooth following
const SPRING_CONFIG = {
  stiffness: 240,
  damping: 38,
  mass: 0.6,
  restDelta: 0.0005,
};

// Click → expand → hold → navigate
const HOLD_DURATION_MS = 4000;
const HOLD_REDUCED_MOTION_MS = 500;
const EXPAND_DURATION_S = 0.6;
const EXPAND_TARGET_SIZE = 480;

const wrap = (x: number, n: number) => ((x % n) + n) % n;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface ShelfWork {
  title: string;
  catalogNumber: string;
  matrixNumber: string;
  category: string;
  year: number;
  shortDescription: string;
  href: string;
  jacketSrc: string;
}

interface Props {
  works: ShelfWork[];
}

interface ExpandState {
  work: ShelfWork;
  rect: DOMRect;
}

export default function Shelf({ works }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const target = useMotionValue(0);
  const scrollX = useSpring(target, SPRING_CONFIG);
  const snapTimeoutRef = useRef<number | null>(null);
  const [expanded, setExpanded] = useState<ExpandState | null>(null);
  const totalCards = works.length;

  const cancelSnap = () => {
    if (snapTimeoutRef.current !== null) {
      clearTimeout(snapTimeoutRef.current);
      snapTimeoutRef.current = null;
    }
  };

  const scheduleSnap = () => {
    cancelSnap();
    snapTimeoutRef.current = window.setTimeout(() => {
      target.set(Math.round(target.get()));
      snapTimeoutRef.current = null;
    }, SNAP_DELAY_MS);
  };

  useEffect(() => {
    return () => cancelSnap();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (expanded) return; // freeze shelf during expansion
      const horizontal =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(horizontal) < 0.5) return;
      e.preventDefault();

      target.set(target.get() + horizontal / WHEEL_PX_PER_UNIT);
      scheduleSnap();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [expanded]);

  // ESC cancels expansion
  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded]);

  const handlePan = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (expanded) return;
    cancelSnap();
    const next = target.get() - info.delta.x / DRAG_PX_PER_UNIT;
    target.set(next);
    scrollX.jump(next);
  };

  const handlePanEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    if (expanded) return;
    const flingCardsPerSec = -info.velocity.x / DRAG_PX_PER_UNIT;
    const projected = target.get() + flingCardsPerSec * FLING_PROJECTION_S;
    target.set(Math.round(projected));
  };

  const handleCardClick = (
    work: ShelfWork,
    el: HTMLAnchorElement,
    e: React.MouseEvent,
  ) => {
    if (work.href === '#') return; // teaser, no expansion
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    setExpanded({ work, rect });
  };

  return (
    <>
      <motion.div
        ref={containerRef}
        className="relative cursor-grab active:cursor-grabbing select-none overflow-hidden h-full w-full"
        style={{
          perspective: '2000px',
          perspectiveOrigin: '50% 50%',
          touchAction: 'none',
          transformStyle: 'preserve-3d',
        }}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
      >
        {works.map((work, i) => (
          <Card
            key={work.catalogNumber}
            work={work}
            index={i}
            scrollX={scrollX}
            totalCards={totalCards}
            onClick={handleCardClick}
            disabled={expanded !== null}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {expanded && (
          <ExpandedOverlay
            work={expanded.work}
            initialRect={expanded.rect}
            onDone={() => {
              window.location.href = expanded.work.href;
            }}
            onCancel={() => setExpanded(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface CardProps {
  work: ShelfWork;
  index: number;
  scrollX: MotionValue<number>;
  totalCards: number;
  onClick: (
    work: ShelfWork,
    el: HTMLAnchorElement,
    e: React.MouseEvent,
  ) => void;
  disabled: boolean;
}

function Card({
  work,
  index,
  scrollX,
  totalCards,
  onClick,
  disabled,
}: CardProps) {
  const halfN = totalCards / 2;
  const linkRef = useRef<HTMLAnchorElement>(null);

  const offset = useTransform(scrollX, (s) => {
    const raw = index - s;
    return wrap(raw + halfN, totalCards) - halfN;
  });

  const x = useTransform(offset, (o) =>
    o < 0 ? o * PAST_EXIT_X : o * CARD_STEP_X,
  );
  const y = useTransform(offset, (o) => (o < 0 ? 0 : -o * CARD_RISE_Y));
  const z = useTransform(offset, (o) => (o < 0 ? 80 : -o * CARD_DEPTH_Z));

  const FADE_PAST_START = -0.5;
  const FADE_PAST_END = -1.3;
  const FADE_BACK_END = halfN;
  const FADE_BACK_START = halfN - 1.5;

  const opacity = useTransform(offset, (o) => {
    if (o < FADE_PAST_END) return 0;
    if (o < FADE_PAST_START) {
      return (o - FADE_PAST_END) / (FADE_PAST_START - FADE_PAST_END);
    }
    if (o > FADE_BACK_END) return 0;
    if (o > FADE_BACK_START) {
      return 1 - (o - FADE_BACK_START) / (FADE_BACK_END - FADE_BACK_START);
    }
    return 1;
  });

  const zIndex = useTransform(offset, (o) =>
    Math.round(100 - Math.abs(o) * 3),
  );

  return (
    <motion.a
      ref={linkRef}
      href={work.href}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onClick={(e) => {
        if (disabled || !linkRef.current) return;
        onClick(work, linkRef.current, e);
      }}
      className="absolute group block w-72 md:w-80 aspect-square"
      style={{
        left: '12%',
        top: '50%',
        marginTop: '-160px',
        x,
        y,
        z,
        opacity,
        zIndex,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="overflow-hidden bg-bg-secondary border border-border-default shadow-[0_24px_60px_rgba(26,26,26,0.22),0_6px_16px_rgba(26,26,26,0.12)] w-full h-full transition-transform duration-300 ease-out group-hover:-translate-y-3">
        <img
          src={work.jacketSrc}
          alt={`${work.title} jacket`}
          width={600}
          height={600}
          className="w-full h-full object-cover pointer-events-none"
          draggable={false}
          loading="lazy"
        />
      </div>
      <div className="absolute -bottom-10 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        <p className="font-mono text-[10px] text-fg-secondary tracking-widest uppercase">
          {work.catalogNumber} :: {work.title}
        </p>
      </div>
    </motion.a>
  );
}

interface ExpandedOverlayProps {
  work: ShelfWork;
  initialRect: DOMRect;
  onDone: () => void;
  onCancel: () => void;
}

function ExpandedOverlay({
  work,
  initialRect,
  onDone,
  onCancel,
}: ExpandedOverlayProps) {
  const reduced = prefersReducedMotion();
  const holdMs = reduced ? HOLD_REDUCED_MOTION_MS : HOLD_DURATION_MS;
  const expandS = reduced ? 0.2 : EXPAND_DURATION_S;
  const fadeOutMs = reduced ? 200 : 900;
  const fadeS = fadeOutMs / 1000;

  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const exitStart = window.setTimeout(
      () => setIsExiting(true),
      Math.max(0, holdMs - fadeOutMs),
    );
    const navigate = window.setTimeout(onDone, holdMs);

    return () => {
      clearTimeout(exitStart);
      clearTimeout(navigate);
    };
  }, [onDone, holdMs, fadeOutMs]);

  // Center the jacket slightly left, leave room for meta text on the right.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
  const size = Math.min(EXPAND_TARGET_SIZE, vh * 0.7);
  const targetLeft = Math.max(vw * 0.08, vw / 2 - size - 80);
  const targetTop = vh / 2 - size / 2;

  return (
    <motion.div
      className="fixed inset-0 z-[200] bg-bg-primary"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onCancel}
    >
      <motion.div
        className="absolute overflow-hidden border border-border-default bg-bg-secondary shadow-[0_40px_80px_rgba(26,26,26,0.28)]"
        initial={{
          left: initialRect.left,
          top: initialRect.top,
          width: initialRect.width,
          height: initialRect.height,
          opacity: 1,
        }}
        animate={{
          left: targetLeft,
          top: targetTop,
          width: size,
          height: size,
          opacity: isExiting ? 0 : 1,
        }}
        exit={{
          left: initialRect.left,
          top: initialRect.top,
          width: initialRect.width,
          height: initialRect.height,
          opacity: 0.4,
        }}
        transition={{
          duration: isExiting ? fadeS : expandS,
          ease: isExiting ? 'easeInOut' : [0.22, 1, 0.36, 1],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={work.jacketSrc}
          alt={`${work.title} jacket`}
          className="w-full h-full object-cover"
        />
      </motion.div>

      <motion.div
        className="absolute max-w-md"
        style={{
          left: `${targetLeft + size + 64}px`,
          top: `${targetTop + size / 2}px`,
          transform: 'translateY(-50%)',
        }}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: isExiting ? 0 : 1, x: 0 }}
        exit={{ opacity: 0, x: 24 }}
        transition={{
          delay: isExiting ? 0 : reduced ? 0 : expandS * 0.6,
          duration: isExiting ? fadeS : 0.5,
          ease: isExiting ? 'easeInOut' : [0.22, 1, 0.36, 1],
        }}
      >
        <p className="font-mono text-[11px] text-fg-secondary mb-4 tracking-widest uppercase">
          {work.catalogNumber} · {work.matrixNumber} · {work.category} · {work.year}
        </p>
        <h1 className="font-display text-5xl text-fg-primary mb-4 leading-none">
          {work.title}
        </h1>
        <p className="font-body text-base text-fg-secondary mb-8 leading-relaxed">
          {work.shortDescription}
        </p>
        <p className="font-mono text-[10px] text-fg-muted tracking-widest uppercase">
          Now loading...
        </p>
      </motion.div>

      <motion.button
        className="fixed top-6 right-6 font-mono text-xs text-fg-secondary hover:text-accent-strong transition-colors"
        initial={{ opacity: 0 }}
        animate={{ opacity: isExiting ? 0 : 1 }}
        exit={{ opacity: 0 }}
        transition={{
          delay: isExiting ? 0 : 0.4,
          duration: isExiting ? fadeS : 0.4,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onCancel();
        }}
      >
        ESC · cancel
      </motion.button>
    </motion.div>
  );
}
