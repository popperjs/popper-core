import type {Dimensions} from '@floating-ui/core';
import {round} from './math';

export function getCssDimensions(
  element: HTMLElement,
  allowFallback?: boolean
): Dimensions & {fallback: boolean} {
  const css = getComputedStyle(element);
  let width = parseFloat(css.width);
  let height = parseFloat(css.height);
  const offsetWidth = element.offsetWidth;
  const offsetHeight = element.offsetHeight;
  const shouldFallback =
    round(width) !== element.offsetWidth ||
    round(height) !== element.offsetHeight;

  if (allowFallback && shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }

  return {
    width,
    height,
    fallback: shouldFallback,
  };
}
