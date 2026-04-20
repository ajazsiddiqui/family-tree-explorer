import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TreeNode } from "@/lib/family-tree";
import { MemberCard } from "./MemberCard";

interface Props {
  nodes: TreeNode[];
  highlightId?: string;
}

const CARD_W = 96;
const CARD_H = 150; // base card height (collapsed)
const CARD_H_EXPANDED = 250; // expanded card height (with details + button)
const COUPLE_GAP = 14; // includes heart space
const SIBLING_GAP = 18;
const ROW_GAP = 128; // vertical space between generations
const CORNER_R = 32; // rounded-corner radius for orthogonal connectors

interface PositionedNode {
  node: TreeNode;
  x: number; // center x
  y: number; // top y
  width: number; // width of this subtree
  childCenters: number[]; // x of each child's center
  pairCenter: number; // center x of the couple pair (= x for single, midpoint for couple)
}

function pairWidth(node: TreeNode) {
  return node.spouse ? CARD_W * 2 + COUPLE_GAP : CARD_W;
}

function layout(node: TreeNode, x: number, y: number): PositionedNode {
  const ownW = pairWidth(node);

  if (node.children.length === 0) {
    return {
      node,
      x: x + ownW / 2,
      y,
      width: ownW,
      childCenters: [],
      pairCenter: x + ownW / 2,
    };
  }

  // layout children to the right starting at x
  const childY = y + 180 + ROW_GAP; // 180 ~ approx card+couple height
  let cursorX = x;
  const childResults: PositionedNode[] = [];
  for (const child of node.children) {
    const r = layout(child, cursorX, childY);
    childResults.push(r);
    cursorX += r.width + SIBLING_GAP;
  }
  cursorX -= SIBLING_GAP;
  const childrenWidth = cursorX - x;

  const totalWidth = Math.max(ownW, childrenWidth);
  // center own pair over childrenWidth
  const pairCenter = x + childrenWidth / 2;

  return {
    node,
    x: pairCenter,
    y,
    width: totalWidth,
    childCenters: childResults.map((c) => c.pairCenter),
    pairCenter,
  };
}


function subtreeWidth(node: TreeNode): number {
  if (node.children.length === 0) return pairWidth(node);
  let w = 0;
  for (const c of node.children) w += subtreeWidth(c) + SIBLING_GAP;
  w -= SIBLING_GAP;
  return Math.max(pairWidth(node), w);
}

function nodeHeight(node: TreeNode, isExpanded?: (id: string) => boolean): number {
  const check = isExpanded ?? (() => false);
  const a = check(node.member.id);
  const b = node.spouse ? check(node.spouse.id) : false;
  return a || b ? CARD_H_EXPANDED : CARD_H;
}

function layoutAt(
  node: TreeNode,
  x: number,
  y: number,
  isExpanded: (id: string) => boolean,
): PositionedNode {
  const ownW = pairWidth(node);
  const subW = subtreeWidth(node);
  const h = nodeHeight(node, isExpanded);

  if (node.children.length === 0) {
    return {
      node,
      x: x + ownW / 2,
      y,
      width: ownW,
      childCenters: [],
      pairCenter: x + ownW / 2,
    };
  }

  const childY = y + h + ROW_GAP;
  let totalChildW = 0;
  for (const c of node.children) totalChildW += subtreeWidth(c) + SIBLING_GAP;
  totalChildW -= SIBLING_GAP;
  const startX = x + (subW - totalChildW) / 2;
  let cursor = startX;
  const centers: number[] = [];
  for (const c of node.children) {
    const cw = subtreeWidth(c);
    const cPos = layoutAt(c, cursor, childY, isExpanded);
    centers.push(cPos.pairCenter);
    cursor += cw + SIBLING_GAP;
  }
  const pairCenter = x + subW / 2;
  return {
    node,
    x: pairCenter,
    y,
    width: subW,
    childCenters: centers,
    pairCenter,
  };
}

function collectAll(
  p: PositionedNode,
  isExpanded: (id: string) => boolean,
  acc: PositionedNode[] = [],
): PositionedNode[] {
  acc.push(p);
  const h = nodeHeight(p.node, isExpanded);
  const childY = p.y + h + ROW_GAP;
  let totalChildW = 0;
  for (const c of p.node.children) totalChildW += subtreeWidth(c) + SIBLING_GAP;
  totalChildW -= SIBLING_GAP;
  const startX = p.x - totalChildW / 2;
  let cursor = startX;
  for (const c of p.node.children) {
    const cw = subtreeWidth(c);
    const childPos = layoutAt(c, cursor, childY, isExpanded);
    collectAll(childPos, isExpanded, acc);
    cursor += cw + SIBLING_GAP;
  }
  return acc;
}

export function FamilyTree({ nodes, highlightId }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(highlightId ? [highlightId] : []),
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const isExpanded = (id: string) => expanded.has(id);

  // layout the forest horizontally
  let xCursor = 0;
  const positions: PositionedNode[] = [];
  for (const root of nodes) {
    const w = subtreeWidth(root);
    const p = layoutAt(root, xCursor, 0, isExpanded);
    collectAll(p, isExpanded, positions);
    xCursor += w + SIBLING_GAP * 4;
  }
  const totalW = xCursor - SIBLING_GAP * 4;
  const totalH = Math.max(
    ...positions.map((p) => p.y + nodeHeight(p.node, isExpanded) + 20),
  );

  // auto-fit
  useLayoutEffect(() => {
    const fit = () => {
      const wrap = wrapperRef.current;
      if (!wrap) return;
      const availW = wrap.clientWidth - 32;
      const availH = Math.min(window.innerHeight * 0.78, 900);
      const s = Math.max(0.5, Math.min(1, availW / totalW, availH / totalH));
      setScale(s);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [totalW, totalH, expanded]);

  // Map childMemberId -> { parentNodeId, childIndex } so we can walk ancestry
  const parentLink = new Map<string, { parentId: string; index: number }>();
  for (const p of positions) {
    p.node.children.forEach((child, i) => {
      parentLink.set(child.member.id, { parentId: p.node.member.id, index: i });
      if (child.spouse) {
        // spouse marriages also get highlighted via the same parent link if user expands spouse
        parentLink.set(child.spouse.id, { parentId: p.node.member.id, index: i });
      }
    });
  }

  // Compute set of highlighted link keys by walking up from each expanded member
  const highlightedLinks = new Set<string>();
  for (const id of expanded) {
    let cur: string | undefined = id;
    while (cur) {
      const link = parentLink.get(cur);
      if (!link) break;
      highlightedLinks.add(`link-${link.parentId}-${link.index}`);
      cur = link.parentId;
    }
  }

  // Build connector path data — orthogonal trunk→bus→drop with rounded corners
  const connectors: { d: string; key: string; highlighted: boolean }[] = [];
  for (const p of positions) {
    if (p.node.children.length === 0) continue;
    const h = nodeHeight(p.node, isExpanded);
    const y1 = p.y + h; // parent bottom
    const busY = p.y + h + ROW_GAP / 2;
    const y2 = p.y + h + ROW_GAP; // child top
    for (let i = 0; i < p.childCenters.length; i++) {
      const cx = p.childCenters[i];
      const key = `link-${p.node.member.id}-${i}`;
      const dx = cx - p.x;
      const adx = Math.abs(dx);
      // limit radius so it never exceeds available space
      const r = Math.min(CORNER_R, adx / 2, (busY - y1), (y2 - busY));
      let d: string;
      if (adx < 1) {
        // straight line, no corners needed
        d = `M ${p.x} ${y1} L ${cx} ${y2}`;
      } else {
        const sx = dx > 0 ? 1 : -1; // horizontal direction
        // path: down to (busY - r), arc into horizontal, across to near cx, arc down, then down to y2
        d = [
          `M ${p.x} ${y1}`,
          `L ${p.x} ${busY - r}`,
          // first quarter arc: turn from down → horizontal toward child
          `Q ${p.x} ${busY} ${p.x + sx * r} ${busY}`,
          `L ${cx - sx * r} ${busY}`,
          // second quarter arc: turn from horizontal → down
          `Q ${cx} ${busY} ${cx} ${busY + r}`,
          `L ${cx} ${y2}`,
        ].join(" ");
      }
      connectors.push({ key, d, highlighted: highlightedLinks.has(key) });
    }
  }

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
          style={{
            width: totalW,
            height: totalH,
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
            position: "relative",
          }}
        >
          {/* SVG connectors */}
          <svg
            width={totalW}
            height={totalH}
            className="absolute inset-0 pointer-events-none"
            style={{ overflow: "visible" }}
          >
            {connectors.map((c, i) => (
              <path
                key={c.key}
                d={c.d}
                stroke={c.highlighted ? "var(--branch-strong, oklch(0.62 0.18 35))" : "oklch(0.82 0.01 80)"}
                strokeWidth={c.highlighted ? 4 : 2}
                strokeLinecap="round"
                fill="none"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1}
                style={{
                  animation: `branch-draw 0.7s cubic-bezier(0.65,0,0.35,1) forwards`,
                  animationDelay: `${0.05 + i * 0.04}s`,
                  transition: "stroke 0.3s ease, stroke-width 0.3s ease",
                  filter: c.highlighted ? "drop-shadow(0 0 6px var(--branch-soft))" : undefined,
                }}
              />
            ))}
          </svg>

          {/* Cards */}
          {positions.map((p, idx) => {
            const isExp1 = expanded.has(p.node.member.id);
            const isExp2 = p.node.spouse ? expanded.has(p.node.spouse.id) : false;
            const tint = ((idx % 6) + 1);
            const pw = pairWidth(p.node);
            const left = p.x - pw / 2;
            return (
              <div
                key={p.node.member.id}
                className="absolute flex items-start gap-0"
                style={{ left, top: p.y, width: pw }}
              >
                <MemberCard
                  member={p.node.member}
                  tint={tint}
                  expanded={isExp1}
                  onToggle={() => toggle(p.node.member.id)}
                />
                {p.node.spouse && (
                  <>
                    <div
                      aria-hidden
                      className="pointer-events-none self-start mt-12 -mx-1 z-10 w-6 h-6 rounded-full bg-white ring-2 ring-[var(--branch)] flex items-center justify-center text-[var(--branch)]"
                      style={{
                        fontFamily:
                          "'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif",
                        fontSize: 11,
                      }}
                    >
                      ❤
                    </div>
                    <MemberCard
                      member={p.node.spouse}
                      tint={tint}
                      expanded={isExp2}
                      onToggle={() => toggle(p.node.spouse!.id)}
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-3 right-4 text-[10px] text-muted-foreground bg-card/80 backdrop-blur rounded-full px-2.5 py-1 border border-border">
        {Math.round(scale * 100)}% · auto-fit
      </div>
    </div>
  );
}
