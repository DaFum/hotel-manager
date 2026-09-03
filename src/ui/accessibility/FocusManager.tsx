import { useRef, type PropsWithChildren } from "react";
function checkPrefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  const mediaQuery =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const inGameAttr =
    typeof document !== "undefined" &&
    document.querySelector('[data-reduced-motion="true"]') !== null;
  return Boolean(mediaQuery || inGameAttr);
}

export function FocusManager({
  labels,
  selected = 0,
  onSelect,
  targets,
  areaIds,
  categories,
}: {
  labels: string[];
  selected?: number;
  onSelect?: (index: number) => void;
  targets?: string[];
  areaIds?: string[];
  categories?: string[];
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  const move = (index: number) => {
    const el = refs.current[index];
    if (el) {
      el.focus();
      el.scrollIntoView?.({
        behavior: checkPrefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
    }
    onSelect?.(index);
  };
  return (
    <div role="tablist">
      {labels.map((label, index) => (
        <button
          type="button"
          key={label}
          ref={(el) => {
            refs.current[index] = el;
          }}
          role="tab"
          data-area={areaIds?.[index]}
          data-category={categories?.[index]}
          aria-controls={targets?.[index]}
          aria-selected={selected === index}
          tabIndex={selected === index ? 0 : -1}
          onClick={() => {
            refs.current[index]?.scrollIntoView?.({
              behavior: checkPrefersReducedMotion() ? "auto" : "smooth",
              block: "nearest",
              inline: "center",
            });
            onSelect?.(index);
          }}
          onKeyDown={(event) => {
            const last = labels.length - 1;
            let next: number | null = null;
            if (event.key === "ArrowRight") next = (index + 1) % labels.length;
            if (event.key === "ArrowLeft")
              next = (index - 1 + labels.length) % labels.length;
            if (event.key === "Home") next = 0;
            if (event.key === "End") next = last;
            if (next !== null) {
              event.preventDefault();
              move(next);
            }
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
export function FocusTarget({ children }: PropsWithChildren) {
  return <>{children}</>;
}
