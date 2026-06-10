import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type PanInfo,
  type MotionValue,
} from 'motion/react';
import { useEffect, useRef } from 'react';

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

const wrap = (x: number, n: number) => ((x % n) + n) % n;

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

export default function Shelf({ works }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // target = where we want to be (updated by input events)
  // scrollX = where we are visually (smoothly follows target via spring)
  const target = useMotionValue(0);
  const scrollX = useSpring(target, SPRING_CONFIG);

  const snapTimeoutRef = useRef<number | null>(null);
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
      const horizontal =
        Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(horizontal) < 0.5) return;
      e.preventDefault();

      target.set(target.get() + horizontal / WHEEL_PX_PER_UNIT);
      scheduleSnap();
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  const handlePan = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    cancelSnap();
    const next = target.get() - info.delta.x / DRAG_PX_PER_UNIT;
    target.set(next);
    // Bypass spring during active drag for 1:1 finger tracking
    scrollX.jump(next);
  };

  const handlePanEnd = (
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const flingCardsPerSec = -info.velocity.x / DRAG_PX_PER_UNIT;
    const projected = target.get() + flingCardsPerSec * FLING_PROJECTION_S;
    target.set(Math.round(projected));
    // Don't jump — let spring smoothly settle to the snap target
  };

  return (
    <motion.div
      ref={containerRef}
      className="relative cursor-grab active:cursor-grabbing select-none overflow-hidden"
      style={{
        height: 'min(820px, 82vh)',
        perspective: '2000px',
        perspectiveOrigin: '50% 50%',
        touchAction: 'pan-y',
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
        />
      ))}
    </motion.div>
  );
}

interface CardProps {
  work: ShelfWork;
  index: number;
  scrollX: MotionValue<number>;
  totalCards: number;
}

function Card({ work, index, scrollX, totalCards }: CardProps) {
  const halfN = totalCards / 2;

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
      href={work.href}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
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
