import { useEffect } from "react";
import { getPageTitle } from "../utils/app";

/**
 * Set document.title. Resets to site title on unmount.
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? getPageTitle(title) : getPageTitle(undefined);
    return () => {
      document.title = prev;
    };
  }, [title]);
}
