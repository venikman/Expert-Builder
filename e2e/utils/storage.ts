import type { Page } from "@playwright/test";

type InitLocalStorageOptions = {
  /**
   * When provided, localStorage will only be cleared once per browser profile
   * (subsequent navigations will keep existing storage).
   */
  onceKey?: string;
  /**
   * Key/value pairs to set after clearing localStorage.
   */
  items?: Record<string, string>;
};

export async function initLocalStorage(
  page: Page,
  { onceKey, items = {} }: InitLocalStorageOptions = {}
) {
  await page.addInitScript(
    ({ onceKey, items }) => {
      if (onceKey && localStorage.getItem(onceKey)) return;

      localStorage.clear();

      if (onceKey) {
        localStorage.setItem(onceKey, "1");
      }

      for (const [key, value] of Object.entries(items)) {
        localStorage.setItem(key, value);
      }
    },
    { onceKey, items }
  );
}
