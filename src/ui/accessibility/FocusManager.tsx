import { useRef, type PropsWithChildren } from "react";
export function FocusManager({
  labels,
  selected = 0,
  onSelect,
  targets,
}: {
  labels: string[];
  selected?: number;
  onSelect?: (index: number) => void;
  targets?: string[];
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (index: number) => {
    const el = refs.current[index];
    if (el) {
      el.focus();
      el.scrollIntoView?.({
        behavior: "smooth",
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
          aria-controls={targets?.[index]}
          aria-selected={selected === index}
          tabIndex={selected === index ? 0 : -1}
          onClick={() => {
            refs.current[index]?.scrollIntoView?.({
              behavior: "smooth",
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
