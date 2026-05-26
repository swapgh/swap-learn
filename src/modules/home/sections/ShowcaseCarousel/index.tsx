"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ShowcaseCarouselContent } from "@/lib/types";
import styles from "./styles.module.css";

export function ShowcaseCarousel({ content }: { content: ShowcaseCarouselContent }) {
  const realCount = content.slides.length;
  const displaySlides = [content.slides[realCount - 1], ...content.slides, content.slides[0]];
  const [displayIndex, setDisplayIndex] = useState(1);
  const [transition, setTransition] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const displayIndexRef = useRef(displayIndex);
  const transitionRef = useRef(transition);

  useEffect(() => {
    displayIndexRef.current = displayIndex;
  }, [displayIndex]);

  useEffect(() => {
    transitionRef.current = transition;
  }, [transition]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    clearTimer();
    if (realCount <= 1) return;
    timerRef.current = setInterval(() => {
      setDisplayIndex((current) => current + 1);
    }, 6000);
  }, [realCount, clearTimer]);

  useEffect(() => {
    resetTimer();
    return clearTimer;
  }, [resetTimer, clearTimer]);

  useEffect(() => {
    if (displayIndex === 0) {
      const id = requestAnimationFrame(() => {
        setTransition(false);
        setDisplayIndex(realCount);
      });
      return () => cancelAnimationFrame(id);
    }
    if (displayIndex === realCount + 1) {
      const id = requestAnimationFrame(() => {
        setTransition(false);
        setDisplayIndex(1);
      });
      return () => cancelAnimationFrame(id);
    }
  }, [displayIndex, realCount]);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        clearTimer();
      } else {
        const idx = displayIndexRef.current;
        const isClone = idx === 0 || idx === realCount + 1;
        if (isClone) {
          setTransition(false);
          setDisplayIndex(idx === 0 ? realCount : 1);
        }
        resetTimer();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [realCount, resetTimer, clearTimer]);

  const goTo = (index: number) => {
    setTransition(true);
    setDisplayIndex(index + 1);
    resetTimer();
  };

  const goToPrevious = () => {
    if (transitionRef.current === false) {
      setTransition(true);
      setDisplayIndex((prev) => prev - 1);
    } else {
      setDisplayIndex((current) => current - 1);
    }
    resetTimer();
  };

  const goToNext = () => {
    if (transitionRef.current === false) {
      setTransition(true);
      setDisplayIndex((prev) => prev + 1);
    } else {
      setDisplayIndex((current) => current + 1);
    }
    resetTimer();
  };

  const realIndex = ((displayIndex - 1) % realCount + realCount) % realCount;

  return (
    <section className={styles.showcase} aria-label={content.ariaLabel}>
      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{
            transform: `translateX(${-displayIndex * 90 + 5}%)`,
            transition: transition ? "transform 420ms ease" : "none",
          }}
        >
          {displaySlides.map((slide, i) => (
            <figure key={`${slide.image}-${i}`} className={styles.slide}>
              <Image
                src={slide.image}
                alt={slide.alt}
                width={960}
                height={540}
                priority={i <= 1}
                loading={i <= 1 ? "eager" : "lazy"}
                sizes="90vw"
              />
            </figure>
          ))}
        </div>

        {realCount > 1 && (
          <div className={styles.showcasebutton}>
            <button type="button" onClick={goToPrevious} aria-label="Previous slide">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button type="button" onClick={goToNext} aria-label="Next slide">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 6 15 12 9 18" />
              </svg>
            </button>
          </div>
        )}

        {realCount > 1 && (
          <div className={styles.dots}>
            {content.slides.map((slide, index) => (
              <button
                key={`${slide.image}-${index}`}
                type="button"
                aria-label={`Slide ${index + 1}`}
                aria-current={realIndex === index ? "true" : undefined}
                onClick={() => goTo(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
