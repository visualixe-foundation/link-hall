"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Site } from "@/data/sites";
import ThemeToggle from "@/components/ThemeToggle";

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function faviconUrl(url: string): string {
  const host = hostOf(url);
  // Google's public favicon service — no third-party cookies on our origin
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=32`;
}

export default function Directory({ sites }: { sites: Site[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const s of sites) {
      if (!seen.includes(s.category)) seen.push(s.category);
    }
    return seen;
  }, [sites]);

  const categoryFromUrl = searchParams.get("category");
  const initialCategory =
    categoryFromUrl && categories.includes(categoryFromUrl)
      ? categoryFromUrl
      : null;
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    initialCategory,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cat = searchParams.get("category");
    setActiveCategory(cat && categories.includes(cat) ? cat : null);
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams, categories]);

  // Keyboard: / focuses search, Escape clears
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape" && document.activeElement === searchInputRef.current) {
        setQuery("");
        updateUrl("", activeCategory);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const updateUrl = useCallback(
    (nextQuery: string, nextCategory: string | null) => {
      const params = new URLSearchParams();
      const q = nextQuery.trim();
      if (q) params.set("q", q);
      if (nextCategory) params.set("category", nextCategory);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const onQueryChange = (value: string) => {
    setQuery(value);
    updateUrl(value, activeCategory);
  };

  const onCategoryChange = (cat: string | null) => {
    setActiveCategory(cat);
    updateUrl(query, cat);
  };

  const clearSearch = () => {
    setQuery("");
    updateUrl("", activeCategory);
    searchInputRef.current?.focus();
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sites.filter((s) => {
      if (activeCategory && s.category !== activeCategory) return false;
      if (!q) return true;
      const haystack = [s.name, s.description, s.category, ...(s.tags ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [sites, query, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<string, Site[]>();
    for (const s of filtered) {
      if (!map.has(s.category)) map.set(s.category, []);
      map.get(s.category)!.push(s);
    }
    return map;
  }, [filtered]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sites) {
      counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    }
    return counts;
  }, [sites]);

  const hasFilter = Boolean(query.trim() || activeCategory);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Header */}
      <header className="mb-10 flex items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-sm font-medium text-accent">Curated directory</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Link Hall
          </h1>
          <p className="mt-3 text-base leading-relaxed text-soft">
            A hand-picked list of good sites, sorted by category. Browse filters
            or search — share any view with the link in your address bar.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
        {/* Sidebar */}
        <aside className="lg:sticky lg:top-8 lg:h-fit lg:w-56 lg:shrink-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-faint">
            Categories
          </p>
          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
            <button
              type="button"
              onClick={() => onCategoryChange(null)}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-left text-sm font-medium transition-colors ${
                activeCategory === null
                  ? "bg-accent text-white shadow-sm"
                  : "bg-surface text-soft ring-1 ring-border hover:bg-accent-soft hover:text-accent-hover"
              }`}
            >
              All sites{" "}
              <span
                className={`tabular-nums ${
                  activeCategory === null ? "text-white/75" : "text-faint"
                }`}
              >
                ({sites.length})
              </span>
            </button>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => onCategoryChange(cat)}
                  className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-white shadow-sm"
                      : "bg-surface text-soft ring-1 ring-border hover:bg-accent-soft hover:text-accent-hover"
                  }`}
                >
                  {cat}{" "}
                  <span
                    className={`tabular-nums ${
                      active ? "text-white/75" : "text-faint"
                    }`}
                  >
                    ({categoryCounts.get(cat) ?? 0})
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block flex-1">
              <span className="sr-only">Search sites</span>
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                placeholder="Search by name, category, or tag…"
                className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-20 text-ink shadow-card placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                {query && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="rounded-lg px-2 py-1 text-xs font-medium text-faint hover:bg-canvas hover:text-ink"
                    aria-label="Clear search"
                  >
                    Clear
                  </button>
                )}
                <kbd className="hidden rounded border border-border bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-faint sm:inline">
                  /
                </kbd>
              </div>
            </label>

            {hasFilter && (
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 py-3 text-sm font-medium text-soft shadow-card transition hover:border-accent/40 hover:text-accent"
              >
                {copied ? (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path
                        fillRule="evenodd"
                        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
                      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                    </svg>
                    Copy link
                  </>
                )}
              </button>
            )}
          </div>

          {hasFilter && (
            <p className="mt-2 text-xs text-faint">
              This view is shareable — the address bar (or Copy link) keeps your
              search and category.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-10">
            {grouped.size === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-surface px-6 py-12 text-center">
                <p className="text-soft">
                  Nothing matches “{query}”. Try a different search, or clear
                  it.
                </p>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="mt-4 text-sm font-medium text-accent hover:text-accent-hover"
                >
                  Clear search
                </button>
              </div>
            )}

            {[...grouped.entries()].map(([category, entries]) => (
              <section
                key={category}
                id={`category-${encodeURIComponent(category)}`}
              >
                <div className="mb-3 flex items-baseline gap-2">
                  <h2 className="text-lg font-semibold text-ink">{category}</h2>
                  <span className="text-sm text-faint">({entries.length})</span>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2">
                  {entries.map((site) => {
                    const host = hostOf(site.url);
                    return (
                      <li key={site.url + site.name}>
                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-4 shadow-card transition hover:border-accent/30 hover:shadow-card-hover"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={faviconUrl(site.url)}
                                alt=""
                                width={20}
                                height={20}
                                loading="lazy"
                                decoding="async"
                                className="h-5 w-5 shrink-0 rounded-sm"
                              />
                              <span className="font-semibold text-ink group-hover:text-accent">
                                {site.name}
                              </span>
                            </div>
                            <span className="shrink-0 rounded-md bg-canvas px-2 py-0.5 text-xs text-faint ring-1 ring-border">
                              {host}
                            </span>
                          </div>
                          <p className="mt-2 flex-1 text-sm leading-relaxed text-soft">
                            {site.description}
                          </p>
                          {site.tags && site.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {site.tags.slice(0, 4).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-md bg-canvas px-1.5 py-0.5 text-[11px] text-faint ring-1 ring-border"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          <span className="mt-3 text-xs font-medium text-accent opacity-0 transition group-hover:opacity-100">
                            Visit site →
                          </span>
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </main>
      </div>

      <footer className="mt-16 border-t border-border pt-8 text-center text-sm text-faint">
        <p>
          {sites.length} sites · Built by{" "}
          <a
            href="https://github.com/visualixe-foundation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-soft underline-offset-2 hover:text-accent hover:underline"
          >
            Visualixe Foundation
          </a>
        </p>
        <p className="mt-1">
          <a
            href="https://github.com/visualixe-foundation/link-hall"
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:text-accent hover:underline"
          >
            Source on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}
