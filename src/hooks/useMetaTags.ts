import { useEffect } from "react";

function setMeta(property: string, content: string) {
  const isOg = property.startsWith("og:");
  const attr = isOg ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Set document title and Open Graph / Twitter meta tags for link sharing.
 * Call when the page content is known (e.g. after event load).
 * When title is empty, no meta updates are performed (e.g. while event is loading).
 */
export function useMetaTags(
  title: string,
  description: string,
  options?: { url?: string; image?: string }
) {
  useEffect(() => {
    if (!title) return;

    document.title = title;
    const url =
      options?.url ??
      (typeof window !== "undefined" ? window.location.href : "");

    setMeta("og:title", title);
    setMeta("og:description", description);
    setMeta("og:url", url);
    setMeta("og:type", "website");
    if (options?.image) setMeta("og:image", options.image);

    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);
    if (options?.image) setMeta("twitter:image", options.image);
  }, [title, description, options?.url, options?.image]);
}
