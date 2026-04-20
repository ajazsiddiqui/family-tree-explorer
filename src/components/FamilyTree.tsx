import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TreeNode } from "@/lib/family-tree";
import { MemberCard } from "./MemberCard";

interface Props {
  nodes: TreeNode[];
  highlightId?: string;
}

const CARD_W = 108;
const CARD_H = 148;
const CARD_H_EXPANDED = 148;
const COUPLE_GAP = 0;
const SIBLING_GAP = 20;
const ROW_GAP = 40;
const CORNER_R = 32;

interface PositionedNode {
  node: TreeNode;
  x: number;
  y: number;
  width: number;
  childCenters: number[];
  pairCenter: number;
  visibleChildren: TreeNode[];
}

function pairWidth(node: TreeNode) {
  return CARD_W * (1 + node.spouses.length) + COUPLE_GAP * node.spouses.length;
}

function subtreeWidth(
  node: TreeNode,
  isOpen: (id: string) => boolean,
  childrenFor: (node: TreeNode) => TreeNode[],
): number {
  if (!isOpen(node.member.id)) return pairWidth(node);
  const kids = childrenFor(node);
  if (kids.length === 0) return pairWidth(node);
  let w = 0;
  for (const c of kids) w += subtreeWidth(c, isOpen, childrenFor) + SIBLING_GAP;
  w -= SIBLING_GAP;
  return Math.max(pairWidth(node), w);
}

function nodeHeight(node: TreeNode, isExpanded?: (id: string) => boolean): number {
  const check = isExpanded ?? (() => false);
  if (check(node.member.id)) return CARD_H_EXPANDED;
  if (node.spouses.some((s) => check(s.id))) return CARD_H_EXPANDED;
  return CARD_H;
}

function layoutAt(
  node: TreeNode,
  x: number,
  y: number,
  isExpanded: (id: string) => boolean,
  isOpen: (id: string) => boolean,
  childrenFor: (node: TreeNode) => TreeNode[],
): PositionedNode {
  const subW = subtreeWidth(node, isOpen, childrenFor);
  const h = nodeHeight(node, isExpanded);
  const kids = childrenFor(node);

  if (kids.length === 0 || !isOpen(node.member.id)) {
    return { node, x: x + subW / 2, y, width: subW, childCenters: [], pairCenter: x + subW / 2, visibleChildren: [] };
  }

  const childY = y + h + ROW_GAP;
  let totalChildW = 0;
  for (const c of kids) totalChildW += subtreeWidth(c, isOpen, childrenFor) + SIBLING_GAP;
  totalChildW -= SIBLING_GAP;
  const startX = x + (subW - totalChildW) / 2;
  let cursor = startX;
  const centers: number[] = [];
  for (const c of kids) {
    const cw = subtreeWidth(c, isOpen, childrenFor);
    centers.push(layoutAt(c, cursor, childY, isExpanded, isOpen, childrenFor).pairCenter);
    cursor += cw + SIBLING_GAP;
  }
  return { node, x: x + subW / 2, y, width: subW, childCenters: centers, pairCenter: x + subW / 2, visibleChildren: kids };
}

function collectAll(
  p: PositionedNode,
  isExpanded: (id: string) => boolean,
  isOpen: (id: string) => boolean,
  childrenFor: (node: TreeNode) => TreeNode[],
  acc: PositionedNode[] = [],
): PositionedNode[] {
  acc.push(p);
  const kids = p.visibleChildren;
  if (!isOpen(p.node.member.id) || kids.length === 0) return acc;
  const h = nodeHeight(p.node, isExpanded);
  const childY = p.y + h + ROW_GAP;
  let totalChildW = 0;
  for (const c of kids) totalChildW += subtreeWidth(c, isOpen, childrenFor) + SIBLING_GAP;
  totalChildW -= SIBLING_GAP;
  const startX = p.x - totalChildW / 2;
  let cursor = startX;
  for (const c of kids) {
    const cw = subtreeWidth(c, isOpen, childrenFor);
    const childPos = layoutAt(c, cursor, childY, isExpanded, isOpen, childrenFor);
    collectAll(childPos, isExpanded, isOpen, childrenFor, acc);
    cursor += cw + SIBLING_GAP;
  }
  return acc;
}

export function FamilyTree({ nodes, highlightId }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(highlightId ? [highlightId] : []));
  const [openBranches, setOpenBranches] = useState<Set<string>>(new Set(highlightId ? [highlightId] : []));
  const [activeWife, setActiveWife] = useState<Map<string, string>>(new Map());
  const [focusId, setFocusId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [manualScale, setManualScale] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const centerOnIdRef = useRef<string | null>(null);
  const positionsRef = useRef<PositionedNode[]>([]);
  const effectiveScaleRef = useRef(1);

  const panState = useRef<{ active: boolean; startX: number; startY: number; scrollLeft: number; scrollTop: number; pointerId: number; moved: boolean } | null>(null);

  const onPanStart = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, [role='button']")) return;
    const el = scrollRef.current;
    if (!el) return;
    panState.current = { active: true, startX: e.clientX, startY: e.clientY, scrollLeft: el.scrollLeft, scrollTop: el.scrollTop, pointerId: e.pointerId, moved: false };
    setIsPanning(true);
  };
  const onPanMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = panState.current; const el = scrollRef.current;
    if (!st || !st.active || !el) return;
    const dx = e.clientX - st.startX; const dy = e.clientY - st.startY;
    if (!st.moved && Math.hypot(dx, dy) > 4) { st.moved = true; try { (e.currentTarget as HTMLDivElement).setPointerCapture(st.pointerId); } catch {} }
    if (st.moved) { el.scrollLeft = st.scrollLeft - dx; el.scrollTop = st.scrollTop - dy; }
  };
  const onPanEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = panState.current;
    if (st?.moved) { try { (e.currentTarget as HTMLDivElement).releasePointerCapture(st.pointerId); } catch {} }
    panState.current = null; setIsPanning(false);
  };

  const zoomIn = () => setManualScale((s) => Math.min(2, (s ?? scale) + 0.1));
  const zoomOut = () => setManualScale((s) => Math.max(0.3, (s ?? scale) - 0.1));
  const zoomReset = () => setManualScale(null);

  const effectiveScale = manualScale ?? scale;
  effectiveScaleRef.current = effectiveScale;

  useEffect(() => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const clamp = (v: number) => Math.max(0.3, Math.min(2, v));
    const onWheel = (e: WheelEvent) => { e.preventDefault(); setManualScale((s) => clamp((s ?? effectiveScaleRef.current) * Math.exp(-e.deltaY * 0.01))); };
    let pinchDist = 0; let pinchScale = 1;
    const dist = (a: Touch, b: Touch) => Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const onTouchStart = (e: TouchEvent) => { if (e.touches.length === 2) { pinchDist = dist(e.touches[0], e.touches[1]); pinchScale = effectiveScaleRef.current; } };
    const onTouchMove = (e: TouchEvent) => { if (e.touches.length === 2 && pinchDist > 0) { e.preventDefault(); setManualScale(clamp(pinchScale * dist(e.touches[0], e.touches[1]) / pinchDist)); } };
    const onTouchEnd = () => { pinchDist = 0; };
    wrap.addEventListener("wheel", onWheel, { passive: false });
    wrap.addEventListener("touchstart", onTouchStart, { passive: true });
    wrap.addEventListener("touchmove", onTouchMove, { passive: false });
    wrap.addEventListener("touchend", onTouchEnd, { passive: true });
    wrap.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => { wrap.removeEventListener("wheel", onWheel); wrap.removeEventListener("touchstart", onTouchStart); wrap.removeEventListener("touchmove", onTouchMove); wrap.removeEventListener("touchend", onTouchEnd); wrap.removeEventListener("touchcancel", onTouchEnd); };
  }, []);

  // Build full-tree maps (always from all nodes for relationship calculations)
  const parentMap = new Map<string, string>();
  const depthMap = new Map<string, number>();
  const spouseSet = new Set<string>();
  const bloodParentMap = new Map<string, string>();
  const bloodChildrenMap = new Map<string, string[]>();
  const memberSpouseMap = new Map<string, string[]>();

  for (const root of nodes) {
    (function walk(node: TreeNode, pid: string | undefined, d: number) {
      if (pid) parentMap.set(node.member.id, pid);
      depthMap.set(node.member.id, d);
      for (const s of node.spouses) {
        parentMap.set(s.id, pid ?? "");
        depthMap.set(s.id, d);
        spouseSet.add(s.id);
      }
      if (node.spouses.length > 0) {
        memberSpouseMap.set(node.member.id, node.spouses.map((s) => s.id));
        for (const s of node.spouses) {
          const ex = memberSpouseMap.get(s.id) ?? [];
          if (!ex.includes(node.member.id)) ex.push(node.member.id);
          memberSpouseMap.set(s.id, ex);
        }
      }
      for (const c of node.children) {
        bloodParentMap.set(c.member.id, node.member.id);
        if (!bloodChildrenMap.has(node.member.id)) bloodChildrenMap.set(node.member.id, []);
        bloodChildrenMap.get(node.member.id)!.push(c.member.id);
        walk(c, node.member.id, d + 1);
      }
    })(root, undefined, 0);
  }

  // When a branch is open, only show the root containing the active path
  const activeRootId = openBranches.size > 0
    ? [...openBranches].find((id) => !parentMap.has(id)) ?? null
    : null;
  const nodesToLayout = activeRootId
    ? nodes.filter((n) => n.member.id === activeRootId)
    : nodes;

  // childrenFor: combines wife-filtering + path-filtering (siblings hidden when on a path)
  const childrenFor = (node: TreeNode): TreeNode[] => {
    // Wife filter: for multi-wife, show only active wife's children
    const activeWifeId = activeWife.get(node.member.id);
    const visible = !activeWifeId || node.spouses.length <= 1
      ? node.children
      : node.children.filter((c) => c.member.motherId === activeWifeId);

    // Path filter: when navigating a branch, hide siblings — only keep the child on the path
    if (openBranches.size > 0 && openBranches.has(node.member.id)) {
      const pathKids = visible.filter((c) => openBranches.has(c.member.id));
      if (pathKids.length > 0) return pathKids; // mid-path: only show path child
    }
    return visible; // deepest open node or no path active: show all
  };

  function allChildren(id: string): string[] {
    const spIds = memberSpouseMap.get(id) ?? [];
    return [...(bloodChildrenMap.get(id) ?? []), ...spIds.flatMap((s) => bloodChildrenMap.get(s) ?? [])];
  }
  function allSiblings(id: string): string[] {
    const pid = bloodParentMap.get(id);
    if (!pid) return [];
    const spIds = memberSpouseMap.get(pid) ?? [];
    return [...(bloodChildrenMap.get(pid) ?? []), ...spIds.flatMap((s) => bloodChildrenMap.get(s) ?? [])].filter((s) => s !== id);
  }
  function computeRelation(focId: string, targetId: string, g: string): string {
    if (focId === targetId) return g === "male" ? "Grandfather" : "Grandmother";
    const fsp = memberSpouseMap.get(focId) ?? [];
    if (fsp.includes(targetId)) return g === "male" ? "Husband" : "Wife";
    const fp = bloodParentMap.get(focId);
    if (fp === targetId) return g === "male" ? "Father" : "Mother";
    if (fp && (memberSpouseMap.get(fp) ?? []).includes(targetId)) return g === "male" ? "Father" : "Mother";
    if (fp) {
      const gp = bloodParentMap.get(fp);
      if (gp === targetId) return g === "male" ? "Grandfather" : "Grandmother";
      if (gp && (memberSpouseMap.get(gp) ?? []).includes(targetId)) return g === "male" ? "Grandfather" : "Grandmother";
    }
    if (allChildren(focId).includes(targetId)) return g === "male" ? "Son" : "Daughter";
    for (const c of allChildren(focId)) if ((memberSpouseMap.get(c) ?? []).includes(targetId)) return g === "male" ? "Son-in-law" : "Daughter-in-law";
    for (const c of allChildren(focId)) if (allChildren(c).includes(targetId)) return g === "male" ? "Grandson" : "Granddaughter";
    if (allSiblings(focId).includes(targetId)) return g === "male" ? "Brother" : "Sister";
    for (const s of allSiblings(focId)) if ((memberSpouseMap.get(s) ?? []).includes(targetId)) return g === "male" ? "Brother-in-law" : "Sister-in-law";
    if (fp) {
      const ps = allSiblings(fp);
      if (ps.includes(targetId)) return g === "male" ? "Uncle" : "Aunt";
      for (const p of ps) if ((memberSpouseMap.get(p) ?? []).includes(targetId)) return g === "male" ? "Uncle" : "Aunt";
    }
    for (const s of allSiblings(focId)) if (allChildren(s).includes(targetId)) return g === "male" ? "Nephew" : "Niece";
    if (fp) for (const p of allSiblings(fp)) if (allChildren(p).includes(targetId)) return "Cousin";
    if (spouseSet.has(targetId)) return g === "male" ? "Husband" : "Wife";
    return (depthMap.get(targetId) ?? 0) === 0 ? (g === "male" ? "Grandfather" : "Grandmother") : (g === "male" ? "Son" : "Daughter");
  }
  function getRelation(id: string, gender: string): string {
    if (focusId && focusId !== id) return computeRelation(focusId, id, gender);
    if (spouseSet.has(id)) return gender === "male" ? "Husband" : "Wife";
    return (depthMap.get(id) ?? 0) === 0 ? (gender === "male" ? "Grandfather" : "Grandmother") : (gender === "male" ? "Son" : "Daughter");
  }

  const toggleHighlight = (id: string) => {
    setFocusId((f) => (f === id ? null : id));
    setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    setManualScale(null);
  };

  const toggleBranch = (primaryId: string, clickedId: string) => {
    setFocusId((f) => (f === clickedId ? null : clickedId));
    setExpanded((s) => { const n = new Set(s); if (n.has(clickedId)) n.delete(clickedId); else n.add(clickedId); return n; });
    setOpenBranches((s) => {
      const wasOpen = s.has(primaryId);
      const sameWife = activeWife.get(primaryId) === clickedId;
      if (wasOpen && sameWife) { const n = new Set(s); n.delete(primaryId); return n; }
      if (wasOpen) return s;
      const next = new Set<string>([primaryId]);
      let cur = parentMap.get(primaryId);
      while (cur) { next.add(cur); cur = parentMap.get(cur); }
      return next;
    });
    setActiveWife((m) => { const n = new Map(m); if (n.get(primaryId) === clickedId) n.delete(primaryId); else n.set(primaryId, clickedId); return n; });
    centerOnIdRef.current = primaryId;
    setManualScale(null);
  };

  const toggle = (id: string) => {
    setFocusId((f) => (f === id ? null : id));
    setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
    setOpenBranches((s) => {
      if (s.has(id)) { const n = new Set(s); n.delete(id); return n; }
      const next = new Set<string>([id]);
      let cur = parentMap.get(id);
      while (cur) { next.add(cur); cur = parentMap.get(cur); }
      return next;
    });
    centerOnIdRef.current = id;
    setManualScale(null);
  };

  const isExpanded = (id: string) => expanded.has(id);
  const isOpen = (id: string) => openBranches.has(id);

  let xCursor = 0;
  const positions: PositionedNode[] = [];
  for (const root of nodesToLayout) {
    const w = subtreeWidth(root, isOpen, childrenFor);
    const p = layoutAt(root, xCursor, 0, isExpanded, isOpen, childrenFor);
    collectAll(p, isExpanded, isOpen, childrenFor, positions);
    xCursor += w + SIBLING_GAP * 4;
  }
  const totalW = Math.max(1, xCursor - SIBLING_GAP * 4);
  const totalH = positions.length
    ? Math.max(...positions.map((p) => p.y + nodeHeight(p.node, isExpanded) + 20))
    : 200;

  positionsRef.current = positions;

  useLayoutEffect(() => {
    const fit = () => {
      const wrap = wrapperRef.current;
      if (!wrap) return;
      setScale(Math.max(0.3, Math.min(1, (wrap.clientWidth - 48) / totalW)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener("resize", fit);
    return () => { ro.disconnect(); window.removeEventListener("resize", fit); };
  }, [totalW, openBranches, activeWife]);

  useEffect(() => {
    const id = centerOnIdRef.current;
    if (!id) return;
    const pos = positionsRef.current.find((p) => p.node.member.id === id);
    if (!pos) return;
    const el = scrollRef.current; const wrap = wrapperRef.current;
    if (!el || !wrap) return;
    const s = effectiveScaleRef.current;
    requestAnimationFrame(() => {
      el.scrollTo({ left: Math.max(0, pos.x * s - wrap.clientWidth / 2), top: Math.max(0, pos.y * s - wrap.clientHeight / 3), behavior: "smooth" });
    });
  }, [openBranches, activeWife]);

  const parentLink = new Map<string, { parentId: string; index: number }>();
  for (const p of positions) {
    p.visibleChildren.forEach((child, i) => {
      parentLink.set(child.member.id, { parentId: p.node.member.id, index: i });
      for (const s of child.spouses) parentLink.set(s.id, { parentId: p.node.member.id, index: i });
    });
  }

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

  const drawElbow = (x1: number, y1: number, x2: number, y2: number) => {
    const busY = (y1 + y2) / 2;
    const dx = x2 - x1; const adx = Math.abs(dx);
    const r = Math.min(CORNER_R, adx / 2, busY - y1, y2 - busY);
    if (adx < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;
    const sx = dx > 0 ? 1 : -1;
    return `M ${x1} ${y1} L ${x1} ${busY - r} Q ${x1} ${busY} ${x1 + sx * r} ${busY} L ${x2 - sx * r} ${busY} Q ${x2} ${busY} ${x2} ${busY + r} L ${x2} ${y2}`;
  };

  const connectors: { d: string; key: string; highlighted: boolean; dashed?: boolean }[] = [];

  for (const p of positions) {
    if (p.visibleChildren.length === 0) continue;
    const h = nodeHeight(p.node, isExpanded);
    const y1 = p.y + h; const y2 = p.y + h + ROW_GAP;
    const pw = pairWidth(p.node); const pairLeft = p.x - pw / 2;
    for (let i = 0; i < p.childCenters.length; i++) {
      const child = p.visibleChildren[i];
      let sourceX = p.x;
      if (p.node.spouses.length > 1 && child.member.motherId) {
        const wi = p.node.spouses.findIndex((s) => s.id === child.member.motherId);
        if (wi >= 0) sourceX = pairLeft + CARD_W * (wi + 1) + CARD_W / 2;
      }
      const key = `link-${p.node.member.id}-${i}`;
      connectors.push({ key, d: drawElbow(sourceX, y1, p.childCenters[i], y2), highlighted: highlightedLinks.has(key) });
    }
  }

  const memberToPos = new Map<string, PositionedNode>();
  for (const p of positions) { memberToPos.set(p.node.member.id, p); for (const s of p.node.spouses) memberToPos.set(s.id, p); }

  for (const p of positions) {
    const pw = pairWidth(p.node);
    p.node.spouses.forEach((spouse, si) => {
      const origParentId = spouse.fatherId ?? spouse.motherId;
      if (!origParentId) return;
      const parentPos = memberToPos.get(origParentId);
      if (!parentPos) return;
      if (parentLink.get(p.node.member.id)?.parentId === parentPos.node.member.id) return;
      const ph = nodeHeight(parentPos.node, isExpanded);
      const spouseCenterX = (p.x - pw / 2) + CARD_W * (si + 1) + CARD_W / 2;
      connectors.push({ key: `wed-${spouse.id}`, d: drawElbow(parentPos.x, parentPos.y + ph, spouseCenterX, p.y), highlighted: false, dashed: true });
    });
  }

  return (
    <div ref={wrapperRef} className="relative flex-1 flex flex-col overflow-hidden min-h-0"
      style={{ background: "linear-gradient(145deg, oklch(0.97 0.018 85) 0%, oklch(0.975 0.025 60) 50%, oklch(0.97 0.018 200) 100%)" }}>
      <div className="pointer-events-none absolute inset-0 opacity-50"
        style={{ background: "radial-gradient(ellipse at 15% 10%, oklch(0.92 0.08 65 / 0.45), transparent 50%), radial-gradient(ellipse at 85% 90%, oklch(0.92 0.07 210 / 0.35), transparent 50%), radial-gradient(ellipse at 50% 50%, oklch(0.96 0.04 340 / 0.2), transparent 60%)" }} />

      {activeRootId && (
        <button
          onClick={() => { setOpenBranches(new Set()); setExpanded(new Set()); setActiveWife(new Map()); setFocusId(null); centerOnIdRef.current = null; setManualScale(null); }}
          className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-[11px] font-medium rounded-full bg-white/85 backdrop-blur-lg border border-white/60 shadow px-3 py-1.5 hover:bg-white transition-colors"
        >
          ← All branches
        </button>
      )}

      <div ref={scrollRef} onPointerDown={onPanStart} onPointerMove={onPanMove} onPointerUp={onPanEnd} onPointerCancel={onPanEnd}
        className="relative flex-1 p-6 flex justify-center items-start overflow-auto min-h-0"
        style={{ cursor: isPanning ? "grabbing" : "grab", touchAction: "none" }}>
        <div style={{
          width: totalW, height: totalH,
          transform: `scale(${effectiveScale})`, transformOrigin: "top center",
          transition: isPanning ? "none" : "transform 0.4s cubic-bezier(0.4,0,0.2,1)",
          position: "relative",
        }}>
          <svg width={totalW} height={totalH} className="absolute inset-0 pointer-events-none" style={{ overflow: "visible" }}>
            {connectors.map((c, i) =>
              c.dashed ? (
                <path key={c.key} d={c.d} stroke="oklch(0.72 0.1 65 / 0.55)" strokeWidth={0.75} strokeLinecap="round" strokeDasharray="3 4" fill="none"
                  style={{ opacity: 0, animation: `wed-fade 0.6s ease-out forwards`, animationDelay: `${0.4 + i * 0.04}s` }} />
              ) : (
                <path key={c.key} d={c.d}
                  stroke={c.highlighted ? "oklch(0.62 0.2 35)" : "oklch(0.72 0.1 65 / 0.55)"}
                  strokeWidth={c.highlighted ? 2 : 1} strokeLinecap="round" fill="none"
                  pathLength={1} strokeDasharray={1} strokeDashoffset={1}
                  style={{
                    animation: `branch-draw 0.7s cubic-bezier(0.65,0,0.35,1) forwards`,
                    animationDelay: `${0.05 + i * 0.04}s`,
                    transition: "stroke 0.3s ease, stroke-width 0.3s ease",
                    filter: c.highlighted ? "drop-shadow(0 0 6px var(--branch-soft))" : undefined,
                  }} />
              )
            )}
          </svg>

          {positions.map((p, idx) => {
            const tint = ((idx % 6) + 1);
            const pw = pairWidth(p.node);
            const left = p.x - pw / 2;
            const hasSpouses = p.node.spouses.length > 0;
            return (
              <div key={p.node.member.id} className="absolute flex items-start gap-0" style={{ left, top: p.y, width: pw }}>
                <MemberCard member={p.node.member} tint={tint} highlighted={expanded.has(p.node.member.id)}
                  onToggle={hasSpouses ? () => toggleHighlight(p.node.member.id) : () => toggle(p.node.member.id)}
                  side={hasSpouses ? "left" : "single"}
                  relation={getRelation(p.node.member.id, p.node.member.gender)} />
                {p.node.spouses.map((spouse, si) => (
                  <MemberCard key={spouse.id} member={spouse} tint={tint} highlighted={expanded.has(spouse.id)}
                    onToggle={() => toggleBranch(p.node.member.id, spouse.id)}
                    side={si === p.node.spouses.length - 1 ? "right" : "middle"}
                    relation={getRelation(spouse.id, spouse.gender)} />
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-1 bg-white/85 backdrop-blur-lg rounded-full px-1 py-1 border border-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.18)]">
        <button onClick={zoomOut} aria-label="Zoom out" className="w-9 h-9 rounded-full active:bg-black/10 hover:bg-black/5 text-foreground/60 hover:text-foreground flex items-center justify-center text-lg font-medium transition-colors">−</button>
        <button onClick={zoomReset} aria-label="Reset zoom" className="px-2 h-9 rounded-full active:bg-black/10 hover:bg-black/5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors min-w-[48px]">{Math.round(effectiveScale * 100)}%</button>
        <button onClick={zoomIn} aria-label="Zoom in" className="w-9 h-9 rounded-full active:bg-black/10 hover:bg-black/5 text-foreground/60 hover:text-foreground flex items-center justify-center text-lg font-medium transition-colors">+</button>
      </div>
    </div>
  );
}
