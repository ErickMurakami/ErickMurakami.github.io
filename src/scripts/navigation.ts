import { synchronizeShowcase } from "./expertise";

let cleanup = () => {};
let readingPosition: ReadingPosition | undefined;
function initializeHeader() {
  cleanup();
  const controller = new AbortController();
  const { signal } = controller;
  let resizeObserver: ResizeObserver | undefined;
  let projectFrame = 0;
  const header = document.querySelector<HTMLElement>(".header");
  const caseBar = document.querySelector("[data-case-bar]");
  if (caseBar && header) {
    const updateReadingHeader = () =>
      header.classList.toggle("is-compact", window.scrollY > 64);
    if (readingPosition)
      header.classList.toggle("is-compact", readingPosition.y > 64);
    else updateReadingHeader();
    window.addEventListener("scroll", updateReadingHeader, {
      passive: true,
      signal,
    });
  }
  if (header && "ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(() =>
      document.documentElement.style.setProperty(
        "--header-offset",
        `${header.getBoundingClientRect().height + 24}px`,
      ),
    );
    resizeObserver.observe(header);
  }
  const updateSectionNavigation = () => {
    const languageToggle =
      document.querySelector<HTMLAnchorElement>(".language-toggle");
    if (
      languageToggle &&
      (location.pathname === "/" || location.pathname === "/pt/") &&
      location.hash &&
      document.getElementById(location.hash.slice(1))
    ) {
      languageToggle.hash = location.hash;
    }

    document
      .querySelectorAll<HTMLAnchorElement>(".primary-nav a")
      .forEach((link) => {
        if (link.pathname === location.pathname && link.hash) {
          if (link.hash === location.hash)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      });
  };
  document.addEventListener(
    "click",
    (event) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        "a[href]",
      );
      if (
        !link ||
        link.classList.contains("language-toggle") ||
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.origin !== location.origin ||
        link.pathname !== location.pathname ||
        link.hash !== "#projects"
      )
        return;
      // Keep native anchors/history; correct the final position after Astro's hash jump.
      cancelAnimationFrame(projectFrame);
      projectFrame = requestAnimationFrame(() => {
        revealProjects(
          matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        );
        updateSectionNavigation();
      });
    },
    { signal, capture: true },
  );
  updateSectionNavigation();
  window.addEventListener("hashchange", updateSectionNavigation, { signal });
  const button = document.querySelector<HTMLButtonElement>(".theme");
  function updateTheme() {
    const light = !document.documentElement.classList.contains("dark");
    button?.setAttribute("aria-pressed", String(light));
    button?.setAttribute(
      "aria-label",
      document.documentElement.lang === "pt-BR"
        ? light
          ? "Ativar tema escuro"
          : "Ativar tema claro"
        : light
          ? "Switch to dark theme"
          : "Switch to light theme",
    );
  }
  updateTheme();
  button?.addEventListener(
    "click",
    () => {
      document.documentElement.classList.toggle("dark");
      try {
        localStorage.setItem(
          "theme",
          document.documentElement.classList.contains("dark")
            ? "dark"
            : "light",
        );
      } catch {}
      updateTheme();
    },
    { signal },
  );
  cleanup = () => {
    controller.abort();
    resizeObserver?.disconnect();
    cancelAnimationFrame(projectFrame);
  };
}
document.addEventListener("astro:before-swap", () => cleanup());
document.addEventListener("astro:after-swap", initializeHeader);
document.addEventListener("astro:page-load", initializeHeader);
initializeHeader();

// Restore only an explicitly requested equivalent-language navigation. Astro
// continues to own ordinary navigation and browser-history scroll restoration.
interface ReadingPosition {
  x: number;
  y: number;
  anchor?: string;
  offset?: number;
  showcaseProgress?: number;
}
function releasedDocumentY(target: HTMLElement) {
  const showcase = target.closest<HTMLElement>(".is-scroll-showcase");
  const sticky = showcase?.querySelector<HTMLElement>(".showcase-sticky");
  if (!showcase || !sticky || !sticky.contains(target))
    return target.getBoundingClientRect().top + scrollY;
  return (
    showcase.getBoundingClientRect().top +
    scrollY +
    showcase.offsetHeight -
    sticky.offsetHeight +
    target.getBoundingClientRect().top -
    sticky.getBoundingClientRect().top
  );
}
function revealProjects(behavior: ScrollBehavior = "instant") {
  const projects = document.getElementById("projects");
  if (!projects) return;
  const headerOffset =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--header-offset",
      ),
    ) ||
    (document.querySelector(".header")?.getBoundingClientRect().height ?? 0) +
      24;
  scrollTo({
    top: releasedDocumentY(projects) - headerOffset,
    behavior,
  });
  synchronizeShowcase();
}
let projectNavigation = false;
let firstPageLoad = true;
document.addEventListener("astro:page-load", () => {
  if (firstPageLoad && location.hash === "#projects") revealProjects();
  firstPageLoad = false;
});
const englishPath = (path: string) =>
  path === "/pt/" ? "/" : path.replace(/^\/pt\//, "/");

document.addEventListener("astro:before-swap", (event) => {
  const { from, to, sourceElement, newDocument, navigationType } = event;
  projectNavigation =
    to.hash === "#projects" &&
    navigationType !== "traverse" &&
    !sourceElement?.closest(".language-toggle");
  // Apply the selected theme before the new root is swapped into the document.
  newDocument.documentElement.classList.toggle(
    "dark",
    document.documentElement.classList.contains("dark"),
  );
  readingPosition = undefined;
  if (
    !sourceElement?.closest(".language-toggle") ||
    englishPath(from.pathname) !== englishPath(to.pathname)
  )
    return;
  readingPosition = { x: scrollX, y: scrollY };
  if (newDocument.querySelector("[data-case-bar]"))
    newDocument
      .querySelector(".header")
      ?.classList.toggle("is-compact", readingPosition.y > 64);
  const showcase = document.querySelector<HTMLElement>(".is-scroll-showcase");
  if (showcase) {
    const top = parseFloat(showcase.style.getPropertyValue("--showcase-top"));
    const travel =
      showcase.offsetHeight -
      showcase.querySelector<HTMLElement>(".showcase-sticky")!.offsetHeight;
    const progress = (top - showcase.getBoundingClientRect().top) / travel;
    if (progress >= 0 && progress <= 1)
      readingPosition.showcaseProgress = progress;
  }
  const anchor = from.hash
    ? document.getElementById(decodeURIComponent(from.hash.slice(1)))
    : null;
  if (anchor && newDocument.getElementById(anchor.id)) {
    readingPosition.anchor = anchor.id;
    readingPosition.offset = -anchor.getBoundingClientRect().top;
  }
});

document.addEventListener("astro:after-swap", () => {
  const position = readingPosition;
  readingPosition = undefined;
  if (!position) {
    if (projectNavigation) revealProjects();
    projectNavigation = false;
    return;
  }
  projectNavigation = false;
  // Both initializers run earlier in this event, before the transition snapshot.
  {
    let y = position.y;
    const showcase = document.querySelector<HTMLElement>(".is-scroll-showcase");
    const anchor = position.anchor
      ? document.getElementById(position.anchor)
      : null;
    if (showcase && position.showcaseProgress !== undefined) {
      const top = parseFloat(showcase.style.getPropertyValue("--showcase-top"));
      const travel =
        showcase.offsetHeight -
        showcase.querySelector<HTMLElement>(".showcase-sticky")!.offsetHeight;
      y =
        showcase.getBoundingClientRect().top +
        scrollY -
        top +
        travel * position.showcaseProgress;
    } else if (anchor) {
      y = releasedDocumentY(anchor) + (position.offset ?? 0);
    }
    window.scrollTo({ left: position.x, top: y, behavior: "instant" });
    synchronizeShowcase();
  }
});
