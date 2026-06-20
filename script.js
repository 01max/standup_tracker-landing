const root = document.documentElement;
const themeToggle = document.querySelector("[data-theme-toggle]");
const themeIcon = document.querySelector("[data-theme-icon]");
const bookmarkletLinks = Array.from(document.querySelectorAll("[data-bookmarklet-link]"));
const copyBookmarkletButton = document.querySelector("[data-copy-bookmarklet]");
const bookmarkletStatus = document.querySelector("[data-bookmarklet-status]");
const storage = {
  get() {
    try {
      return localStorage.getItem("theme");
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      localStorage.setItem("theme", value);
    } catch {
      return undefined;
    }
  },
};
const storedTheme = storage.get();
const bookmarkletSourceUrl = "https://raw.githubusercontent.com/01max/standup_tracker/main/standup-companion.bookmarklet.js";
let bookmarkletUrl = "";

function applyTheme(theme, persist = true) {
  const nextTheme = theme === "light" ? "light" : "dark";
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;

  if (themeIcon) {
    themeIcon.textContent = nextTheme === "dark" ? "☀" : "☾";
  }

  if (themeToggle) {
    const nextLabel = nextTheme === "dark" ? "Switch to light theme" : "Switch to dark theme";
    themeToggle.setAttribute("aria-label", nextLabel);
    themeToggle.setAttribute("title", nextLabel);
  }

  if (persist) {
    storage.set(nextTheme);
  }
}

function setBookmarkletStatus(message) {
  if (bookmarkletStatus) {
    bookmarkletStatus.textContent = message;
  }
}

async function loadBookmarklet() {
  try {
    const response = await fetch(bookmarkletSourceUrl, { cache: "no-store" });
    const text = (await response.text()).trim();

    if (!response.ok || !text.startsWith("javascript:")) {
      throw new Error("Bookmarklet failed to load");
    }

    bookmarkletUrl = text;

    for (const link of bookmarkletLinks) {
      link.href = bookmarkletUrl;
      link.setAttribute("aria-disabled", "false");
    }

    if (copyBookmarkletButton) {
      copyBookmarkletButton.disabled = false;
    }

    setBookmarkletStatus("ready: drag or copy");
  } catch (_error) {
    setBookmarkletStatus("bookmarklet URL could not load from GitHub");
  }
}

applyTheme(storedTheme, false);

themeToggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
});

for (const link of bookmarkletLinks) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    setBookmarkletStatus(bookmarkletUrl ? "drag the link to install it" : "bookmarklet is still loading");
  });
}

copyBookmarkletButton?.addEventListener("click", async () => {
  if (!bookmarkletUrl) {
    setBookmarkletStatus("bookmarklet is still loading");
    return;
  }

  try {
    await navigator.clipboard.writeText(bookmarkletUrl);
    setBookmarkletStatus("bookmarklet URL copied");
  } catch (_error) {
    setBookmarkletStatus("copy failed; drag the link instead");
  }
});

loadBookmarklet();
