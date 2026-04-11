/**
 * Animate collapsible `:::info` / `:::warning` / `:::success` / `:::error`
 * callouts. The remark plugin wraps the non-summary children in a
 * `.info-box-content` div; this plugin intercepts summary clicks and runs a
 * Web Animations API height + opacity transition on that wrapper.
 *
 * Works across all browsers (including Safari) without needing modern
 * `::details-content` / `interpolate-size` CSS. Honors
 * `prefers-reduced-motion: reduce` by falling back to the native toggle.
 */
export default defineNuxtPlugin(() => {
  if (import.meta.server) return;

  const DURATION = 280;
  const EASING = "cubic-bezier(0.4, 0, 0.2, 1)";
  const running = new WeakMap<HTMLDetailsElement, Animation>();

  function prefersReducedMotion(): boolean {
    return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }

  function findContent(details: HTMLDetailsElement): HTMLElement | null {
    return details.querySelector<HTMLElement>(":scope > .info-box-content");
  }

  function openDetails(details: HTMLDetailsElement) {
    const content = findContent(details);
    if (!content) {
      details.open = true;
      return;
    }
    running.get(details)?.cancel();

    details.open = true;
    content.style.height = "0px";
    const target = content.scrollHeight;

    const anim = content.animate(
      [
        { height: "0px", opacity: 0 },
        { height: `${target}px`, opacity: 1 },
      ],
      { duration: DURATION, easing: EASING },
    );
    running.set(details, anim);

    const cleanup = () => {
      content.style.height = "";
      running.delete(details);
    };
    anim.onfinish = cleanup;
    anim.oncancel = cleanup;
  }

  function closeDetails(details: HTMLDetailsElement) {
    const content = findContent(details);
    if (!content) {
      details.open = false;
      return;
    }
    running.get(details)?.cancel();

    const start = content.scrollHeight;
    content.style.height = `${start}px`;

    const anim = content.animate(
      [
        { height: `${start}px`, opacity: 1 },
        { height: "0px", opacity: 0 },
      ],
      { duration: DURATION, easing: EASING },
    );
    running.set(details, anim);

    anim.onfinish = () => {
      details.open = false;
      content.style.height = "";
      running.delete(details);
    };
    anim.oncancel = () => {
      content.style.height = "";
      running.delete(details);
    };
  }

  function handleClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    const summary = target.closest("summary");
    if (!summary) return;
    const details = summary.parentElement as HTMLDetailsElement | null;
    if (!details || details.tagName !== "DETAILS") return;
    if (!details.classList.contains("info-box")) return;
    if (prefersReducedMotion()) return;

    event.preventDefault();
    if (details.open) closeDetails(details);
    else openDetails(details);
  }

  document.addEventListener("click", handleClick, true);
});
