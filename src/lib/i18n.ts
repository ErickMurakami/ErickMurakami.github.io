export const linkedin = "https://www.linkedin.com/in/erick-murakami";
export function languagePaths(path: string) {
  const english =
    path === "/pt/" ? "/" : path.startsWith("/pt/") ? path.slice(3) : path;
  return {
    en: english === "/404/" ? "/404.html" : english,
    pt: english === "/404.html" ? "/pt/404/" : `/pt${english}`,
  };
}
