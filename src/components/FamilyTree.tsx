import { useEffect, useRef, useState } from "react";
import type { TreeNode } from "@/lib/family-tree";
import { MemberCard } from "./MemberCard";

interface Props {
  nodes: TreeNode[];
  highlightId?: string;
}

/** A pair = the member + (optionally) their spouse, displayed side-by-side. */
function CouplePair({
  node,
  tint,
  highlightId,
  onAnyToggle,
}: {
  node: TreeNode;
  tint: number;
  highlightId?: string;
  onAnyToggle: () => void;
}) {
  const [exp1, setExp1] = useState(highlightId === node.member.id);
  const [exp2, setExp2] = useState(highlightId === node.spouse?.id);

  return (
    <div className="relative inline-flex items-start gap-1 px-1">
      <MemberCard
        member={node.member}
        tint={tint}
        expanded={exp1}
        onToggle={() => {
          setExp1((e) => !e);
          requestAnimationFrame(onAnyToggle);
        }}
      />
      {node.spouse && (
        <>
          {/* heart connector between spouses (decorative, non-blocking) */}
          <div
            aria-hidden
            className="pointer-events-none self-center -mx-1.5 z-10 w-6 h-6 rounded-full bg-white ring-2 ring-[var(--branch)] flex items-center justify-center mt-14 text-[var(--branch)]"
            style={{ fontFamily: "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif", fontSize: 11 }}
          >
            ❤
          </div>
          <MemberCard
            member={node.spouse}
            tint={tint}
            expanded={exp2}
            onToggle={() => {
              setExp2((e) => !e);
              requestAnimationFrame(onAnyToggle);
            }}
          />
        </>
      )}
    </div>
  );
}

function NodeView({
  node,
  tint,
  highlightId,
  onAnyToggle,
}: {
  node: TreeNode;
  tint: number;
  highlightId?: string;
  onAnyToggle: () => void;
}) {
  return (
    <li className="relative flex flex-col items-center px-3">
      <CouplePair
        node={node}
        tint={tint}
        highlightId={highlightId}
        onAnyToggle={onAnyToggle}
      />
      {node.children.length > 0 && (
        <ul className="tree-children flex justify-center mt-[150px] relative">
          {node.children.map((c, i) => (
            <NodeView
              key={c.member.id}
              node={c}
              tint={((tint + i) % 6) + 1}
              highlightId={highlightId}
              onAnyToggle={onAnyToggle}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FamilyTree({ nodes, highlightId }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const fit = () => {
    const wrap = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    inner.style.transform = "scale(1)";
    const naturalW = inner.scrollWidth;
    const naturalH = inner.scrollHeight;
    const availW = wrap.clientWidth - 32;
    const availH = Math.min(window.innerHeight * 0.78, 900);
    const s = Math.max(0.55, Math.min(1, availW / naturalW, availH / naturalH));
    setScale(s);
  };

  useEffect(() => {
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="relative rounded-3xl bg-[var(--gradient-soft)] border border-border shadow-[var(--shadow-soft)] overflow-hidden"
      style={{ minHeight: 520 }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, oklch(0.95 0.06 60 / 0.5), transparent 55%), radial-gradient(circle at 80% 100%, oklch(0.95 0.06 200 / 0.4), transparent 55%)",
        }}
      />
      <div className="relative p-6 flex justify-center items-start overflow-auto">
        <div
          ref={innerRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <ul className="tree-root inline-flex justify-center">
            {nodes.map((n, i) => (
              <NodeView
                key={n.member.id}
                node={n}
                tint={i + 1}
                highlightId={highlightId}
                onAnyToggle={fit}
              />
            ))}
          </ul>
        </div>
      </div>

      <div className="absolute bottom-3 right-4 text-[10px] text-muted-foreground bg-card/80 backdrop-blur rounded-full px-2.5 py-1 border border-border">
        {Math.round(scale * 100)}% · auto-fit
      </div>

      <style>{`
        .tree-root, .tree-root ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .tree-children > li {
          position: relative;
        }
        /* trunk down from parent */
        .tree-children::before {
          content: "";
          position: absolute;
          top: -80px;
          left: 50%;
          width: 2.5px;
          height: 80px;
          background: var(--branch);
          transform: translateX(-50%);
          border-radius: 4px;
        }
        /* horizontal bus across siblings */
        .tree-children > li::before {
          content: "";
          position: absolute;
          top: -50px;
          left: 0;
          right: 0;
          height: 2.5px;
          background: var(--branch);
          border-radius: 4px;
        }
        .tree-children > li:only-child::before {
          left: 50%;
          right: 50%;
        }
        .tree-children > li:first-child::before {
          left: 50%;
          border-top-left-radius: 12px;
          border-bottom-left-radius: 12px;
        }
        .tree-children > li:last-child::before {
          right: 50%;
          border-top-right-radius: 12px;
          border-bottom-right-radius: 12px;
        }
        /* drop from bus into each child */
        .tree-children > li::after {
          content: "";
          position: absolute;
          top: -50px;
          left: 50%;
          width: 2.5px;
          height: 50px;
          background: var(--branch);
          transform: translateX(-50%);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
