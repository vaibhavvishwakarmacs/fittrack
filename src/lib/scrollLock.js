/**
 * Rock-solid iOS & mobile scroll lock utility.
 * In iOS Safari, simply setting body overflow: hidden fails because the html
 * viewport still captures rubber-band touch gestures.
 * This utility locks window position, body fixed coords, overscroll-behavior,
 * and maintains a reference count for nested modals.
 */

import { useEffect } from 'react';

let lockCount = 0;
let savedScrollY = 0;

export const lockScroll = () => {
  if (typeof window === 'undefined') return;

  lockCount++;
  if (lockCount === 1) {
    savedScrollY = window.scrollY || document.documentElement.scrollTop || 0;

    // Lock html and body
    const docEl = document.documentElement;
    const body = document.body;

    docEl.style.overflow = 'hidden';
    docEl.style.overscrollBehavior = 'none';

    body.style.position = 'fixed';
    body.style.top = `-${savedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    body.style.overscrollBehavior = 'none';
  }
};

export const unlockScroll = () => {
  if (typeof window === 'undefined') return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    const docEl = document.documentElement;
    const body = document.body;

    const top = body.style.top;
    const scrollY = top ? Math.abs(parseInt(top, 10)) : savedScrollY;

    docEl.style.overflow = '';
    docEl.style.overscrollBehavior = '';

    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    body.style.overscrollBehavior = '';

    window.scrollTo(0, scrollY);
  }
};

/**
 * React hook to lock body scrolling while a modal/sheet is active.
 * Automatically cleans up on unmount.
 */
export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;

    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isLocked]);
};
