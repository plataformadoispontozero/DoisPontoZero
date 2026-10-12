import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
export const Tooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}> = ({ content, children, position = "top", className }) => {
  const [rect, setRect] = React.useState<DOMRect | null>(null),
    ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!rect) return;
    const hide = () => setRect(null);
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [rect]);
  const show = () => setRect(ref.current?.getBoundingClientRect() || null);
  const styles: React.CSSProperties = rect
    ? position === "right"
      ? {
          left: rect.right + 8,
          top: rect.top + rect.height / 2,
          transform: "translateY(-50%)",
        }
      : position === "left"
        ? {
            left: rect.left - 8,
            top: rect.top + rect.height / 2,
            transform: "translate(-100%,-50%)",
          }
        : position === "bottom"
          ? {
              left: rect.left + rect.width / 2,
              top: rect.bottom + 8,
              transform: "translateX(-50%)",
            }
          : {
              left: rect.left + rect.width / 2,
              top: rect.top - 8,
              transform: "translate(-50%,-100%)",
            }
    : {};
  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center", className)}
      onMouseEnter={show}
      onMouseLeave={() => setRect(null)}
      onFocus={show}
      onBlur={() => setRect(null)}
    >
      {children}
      {rect &&
        createPortal(
          <div
            role="tooltip"
            style={styles}
            className="fixed z-[70] whitespace-nowrap rounded-md bg-[var(--color-surface-elevated)] border border-[var(--color-border)] px-2 py-1 text-[11px] text-[var(--color-text-primary)] shadow-lg pointer-events-none"
          >
            {content}
          </div>,
          document.body,
        )}
    </div>
  );
};
