export {};

let cleanup = () => {};
let synchronize = () => {};
export const synchronizeShowcase = () => synchronize();
function initializeShowcase() {
  cleanup();
  const section = document.querySelector<HTMLElement>(
    "[data-expertise-showcase]",
  );
  if (section) {
    const controller = new AbortController();
    const { signal } = controller;
    let disposed = false;
    const sticky = section.querySelector<HTMLElement>(".showcase-sticky")!;
    const cards = [...section.querySelectorAll<HTMLElement>(".expertise-card")];
    const marks = [...section.querySelectorAll<HTMLElement>(".expertise-mark")];
    const media = matchMedia("(prefers-reduced-motion: no-preference)");
    let frame = 0;
    let visible = true;
    let active = -1;
    let viewportWidth = innerWidth;
    let viewportHeight = innerHeight;
    let progress = 0;
    function update() {
      frame = 0;
      if (!visible || !section!.classList.contains("is-scroll-showcase"))
        return;
      const offset = parseFloat(
        section!.style.getPropertyValue("--showcase-top"),
      );
      const travel = section!.offsetHeight - sticky.offsetHeight;
      progress =
        (offset - section!.getBoundingClientRect().top) / Math.max(1, travel);
      const index = Math.round(
        Math.max(0, Math.min(1, progress)) * (cards.length - 1),
      );
      if (index === active) return;
      active = index;
      cards.forEach((card, i) =>
        card.classList.toggle("is-active", i === index),
      );
      marks.forEach((mark, i) =>
        mark.classList.toggle("is-active", i === index),
      );
      section!.dataset.activeCard = String(index);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    function configure() {
      const rotated = viewportWidth !== innerWidth;
      const restoreProgress =
        rotated && active >= 0 && progress >= 0 && progress <= 1;
      const previousProgress = progress;
      if (rotated) {
        viewportWidth = innerWidth;
        viewportHeight = innerHeight;
      }
      const mobile = innerWidth <= 1000;
      const top = document
        .querySelector(".header")!
        .getBoundingClientRect().height;
      section!.style.setProperty("--showcase-top", `${top}px`);
      section!.classList.toggle("is-scroll-showcase", media.matches);
      // Projects begins inside the visual frame. Increasing the scroll runway
      // below that frame therefore never delays its initial visibility.
      const introduction = sticky.querySelector<HTMLElement>(".hero")!;
      const strip = sticky.querySelector<HTMLElement>(".specialty-strip")!;
      const heading = sticky.querySelector<HTMLElement>(
        "#projects .section-heading",
      )!;
      const essentialHeight =
        introduction.offsetHeight +
        strip.offsetHeight +
        (innerWidth > 1000 ? heading.offsetHeight : 0);
      if (!mobile && media.matches && essentialHeight > innerHeight - top - 12)
        section!.classList.remove("is-scroll-showcase");
      // Browser chrome changes height while scrolling. Keep the mobile layout
      // enabled and its runway stable; only rotation changes its geometry.
      if (mobile && essentialHeight > viewportHeight - top - 12) {
        const expertise = sticky.querySelector<HTMLElement>(".expertise")!;
        const expertiseOffset =
          expertise.getBoundingClientRect().top -
          sticky.getBoundingClientRect().top;
        section!.style.setProperty(
          "--showcase-top",
          `${top - expertiseOffset}px`,
        );
      }
      section!.style.setProperty(
        "--showcase-height",
        `${sticky.offsetHeight}px`,
      );
      section!.style.setProperty(
        "--showcase-travel",
        `${3 * Math.min(320, Math.max(240, (mobile ? viewportHeight : innerHeight) * 0.3))}px`,
      );
      if (
        restoreProgress &&
        section!.classList.contains("is-scroll-showcase")
      ) {
        const offset = parseFloat(
          section!.style.getPropertyValue("--showcase-top"),
        );
        const start = section!.getBoundingClientRect().top + scrollY - offset;
        const travel = section!.offsetHeight - sticky.offsetHeight;
        scrollTo({
          top: start + previousProgress * travel,
          behavior: "instant",
        });
      }
      update();
    }
    const observer = new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
    });
    observer.observe(section);
    window.addEventListener("scroll", schedule, { passive: true, signal });
    window.addEventListener("resize", configure, { signal });
    media.addEventListener("change", configure, { signal });
    synchronize = () => {
      cancelAnimationFrame(frame);
      update();
    };
    configure();
    document.fonts.ready.then(() => {
      if (!disposed) configure();
    });
    cleanup = () => {
      disposed = true;
      synchronize = () => {};
      controller.abort();
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }
}
document.addEventListener("astro:before-swap", () => cleanup());
document.addEventListener("astro:after-swap", initializeShowcase);
document.addEventListener("astro:page-load", initializeShowcase);
initializeShowcase();
