import { useEffect, useRef, useState } from "react";
import type { TreeNode } from "@/lib/family-tree";
import { MemberCard } from "./MemberCard";

interface Props {
  nodes: TreeNode[];
  highlightId?: string;
}

function NodeView({
  node,
  highlightId,
  onAnyToggle,
}: {
  node: TreeNode;
  highlightId?: string;
  onAnyToggle: () => void;
}) {
  const [expanded, setExpanded] = useState(highlightId === node.member.id);

  return (
    <li className="relative flex flex-col items-center px-2">
      <div className="w-[180px]">
        <MemberCard
          member={node.member}
          spouse={node.spouse}
          expanded={expanded}
          onToggle={() => {
            setExpanded((e) => !e);
            // defer so DOM updates first
            requestAnimationFrame(onAnyToggle);
          }}
        />
      </div>

      {node.children.length > 0 && (
        <ul className="tree-children flex justify-center pt-12 mt-8 relative">
          {node.children.map((c) => (
            <NodeView
              key={c.member.id}
              node={c}
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
    // measure natural size at scale 1
    inner.style.transform = "scale(1)";
    const naturalW = inner.scrollWidth;
    const naturalH = inner.scrollHeight;
    const availW = wrap.clientWidth - 32;
    const availH = Math.min(window.innerHeight * 0.78, 900);
    const s = Math.min(1, availW / naturalW, availH / naturalH);
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
      style={{ minHeight: 480 }}
    >
      {/* decorative glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 20% 0%, oklch(0.95 0.06 200 / 0.6), transparent 50%), radial-gradient(circle at 80% 100%, oklch(0.95 0.06 340 / 0.5), transparent 50%)",
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
            {nodes.map((n) => (
              <NodeView
                key={n.member.id}
                node={n}
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
        .tree-children::before {
          content: "";
          position: absolute;
          top: -32px;
          left: 50%;
          width: 2px;
          height: 32px;
          background: linear-gradient(180deg, transparent, var(--branch));
          transform: translateX(-50%);
          border-radius: 2px;
        }
        .tree-children > li::before {
          content: "";
          position: absolute;
          top: -20px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--branch);
          border-radius: 2px;
        }
        .tree-children > li:only-child::before {
          left: 50%;
          right: 50%;
        }
        .tree-children > li:first-child::before {
          left: 50%;
        }
        .tree-children > li:last-child::before {
          right: 50%;
        }
        .tree-children > li::after {
          content: "";
          position: absolute;
          top: -20px;
          left: 50%;
          width: 2px;
          height: 20px;
          background: var(--branch);
          transform: translateX(-50%);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
