"use client";

/**
 * SkipNav — Accessibility Skip Navigation Link
 *
 * Renders a visually hidden link that becomes visible on keyboard focus,
 * allowing keyboard users to skip past the header directly to main content.
 * WCAG 2.1 Level A requirement (2.4.1 Bypass Blocks).
 */

export default function SkipNav() {
  return (
    <a
      href="#main-content"
      className="skip-nav"
    >
      Skip to main content
    </a>
  );
}
