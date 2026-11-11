import { synchronizeShowcase } from "./expertise";

let cleanup = () => {};
let readingPosition: ReadingPosition | undefined;
let activeHomeSection: string | undefined;
let homeScrollTarget: string | undefined;
const lifecycle = new AbortController();
const lifecycleOptions = { signal: lifecycle.signal };
function applyTheme(dark: boolean, root = document.documentElement) {
  root.classList.toggle("dark", dark);
  root.dataset.theme = dark ? "dark" : "light";
  root.style.colorScheme = dark ? "dark" : "light";
}
function initializeHeader() {
  cleanup();
  const controller = new AbortController();
  const { signal } = controller;
  if (!document.querySelector(".portfolio-home")) {
    activeHomeSection = undefined;
    homeScrollTarget = undefined;
  }
  else if (location.hash) activeHomeSection = location.hash.slice(1);
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
    } else if (languageToggle && document.querySelector(".portfolio-home")) {
      languageToggle.hash = "";
    }

    document
      .querySelectorAll<HTMLAnchorElement>(".primary-nav a")
      .forEach((link) => {
        if (link.pathname === location.pathname && link.hash) {
          if (link.hash === (activeHomeSection ? `#${activeHomeSection}` : location.hash))
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
        !link.hash ||
        !document.querySelector(".portfolio-home") ||
        !link.closest(".primary-nav, .hero, .footer")
      )
        return;
      const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
      if (!target) return;
      event.preventDefault();
      activeHomeSection = target.id;
      // Keep native anchor URLs as a no-JavaScript fallback, with clean URLs on normal clicks.
      if (location.hash) history.replaceState(history.state, "", location.pathname + location.search);
      cancelAnimationFrame(projectFrame);
      projectFrame = requestAnimationFrame(() => {
        homeScrollTarget = matchMedia("(prefers-reduced-motion: reduce)").matches ? undefined : target.id;
        revealSection(target,
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
  window.addEventListener("scrollend", () => { homeScrollTarget = undefined; }, { signal });
  window.addEventListener("hashchange", () => {
    activeHomeSection = location.hash.slice(1) || undefined;
    updateSectionNavigation();
  }, { signal });
  const button = document.querySelector<HTMLButtonElement>(".theme");
  applyTheme(document.documentElement.classList.contains("dark"));
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
      applyTheme(!document.documentElement.classList.contains("dark"));
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
document.addEventListener("astro:before-swap", () => cleanup(), lifecycleOptions);
document.addEventListener("astro:after-swap", initializeHeader, lifecycleOptions);
document.addEventListener("astro:page-load", initializeHeader, lifecycleOptions);
initializeHeader();

// Restore only an explicitly requested equivalent-language navigation. Astro
// continues to own ordinary navigation and browser-history scroll restoration.
interface ReadingPosition {
  x: number;
  y: number;
  anchor?: string;
  offset?: number;
  showcaseProgress?: number;
  homeDestination?: string;
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
function revealSection(target: HTMLElement, behavior: ScrollBehavior = "instant") {
  const headerOffset =
    parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue(
        "--header-offset",
      ),
    ) ||
    (document.querySelector(".header")?.getBoundingClientRect().height ?? 0) +
      24;
  scrollTo({
    top: releasedDocumentY(target) + parseFloat(getComputedStyle(target).paddingTop) - headerOffset,
    behavior,
  });
  synchronizeShowcase();
}
function revealProjects(behavior: ScrollBehavior = "instant") {
  const projects = document.getElementById("projects");
  if (projects) revealSection(projects, behavior);
}
let projectNavigation = false;
let firstPageLoad = true;
document.addEventListener("astro:page-load", () => {
  if (firstPageLoad && location.hash === "#projects") revealProjects();
  firstPageLoad = false;
}, lifecycleOptions);
const englishPath = (path: string) =>
  path === "/pt/" ? "/" : path.replace(/^\/pt\//, "/");

document.addEventListener("astro:before-swap", (event) => {
  const { from, to, sourceElement, newDocument, navigationType } = event;
  projectNavigation =
    to.hash === "#projects" &&
    navigationType !== "traverse" &&
    !sourceElement?.closest(".language-toggle");
  // Apply the selected theme before the new root is swapped into the document.
  applyTheme(document.documentElement.classList.contains("dark"), newDocument.documentElement);
  readingPosition = undefined;
  if (
    !sourceElement?.closest(".language-toggle") ||
    englishPath(from.pathname) !== englishPath(to.pathname)
  )
    return;
  readingPosition = { x: scrollX, y: scrollY };
  if (homeScrollTarget) {
    readingPosition.homeDestination = homeScrollTarget;
    homeScrollTarget = undefined;
    window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
  }
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
  const anchorId = from.hash.slice(1) || (document.querySelector(".portfolio-home") ? activeHomeSection : undefined);
  const anchor = anchorId
    ? document.getElementById(decodeURIComponent(anchorId))
    : null;
  if (anchor && newDocument.getElementById(anchor.id)) {
    readingPosition.anchor = anchor.id;
    readingPosition.offset = -anchor.getBoundingClientRect().top;
  }
}, lifecycleOptions);

document.addEventListener("astro:after-swap", () => {
  const position = readingPosition;
  readingPosition = undefined;
  if (!position) {
    if (projectNavigation) revealProjects();
    projectNavigation = false;
    return;
  }
  projectNavigation = false;
  if (position.homeDestination) {
    const target = document.getElementById(position.homeDestination);
    if (target) {
      revealSection(target);
      return;
    }
  }
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
}, lifecycleOptions);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cleanup();
    lifecycle.abort();
  });
}
