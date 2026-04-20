import { useState } from "react";
import type { TreeNode } from "@/lib/family-tree";
import { MemberCard } from "./MemberCard";

interface Props {
  nodes: TreeNode[];
  highlightId?: string;
}

function NodeView({
  node,
  highlightId,
}: {
  node: TreeNode;
  highlightId?: string;
}) {
  const [expanded, setExpanded] = useState(highlightId === node.member.id);

  return (
    <li className="relative flex flex-col items-center px-3">
      <div className="w-[200px]">
        <MemberCard
          member={node.member}
          spouse={node.spouse}
          expanded={expanded}
          onToggle={() => setExpanded((e) => !e)}
        />
      </div>

      {node.children.length > 0 && (
        <ul className="tree-children flex justify-center pt-8 mt-4 relative">
          {node.children.map((c) => (
            <NodeView key={c.member.id} node={c} highlightId={highlightId} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function FamilyTree({ nodes, highlightId }: Props) {
  return (
    <div className="overflow-auto p-6 rounded-3xl bg-[var(--gradient-soft)] border border-border">
      <ul className="tree-root inline-flex justify-center min-w-full">
        {nodes.map((n) => (
          <NodeView key={n.member.id} node={n} highlightId={highlightId} />
        ))}
      </ul>

      <style>{`
        .tree-root, .tree-root ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .tree-children > li {
          position: relative;
        }
        /* vertical line from parent down to children container */
        .tree-children::before {
          content: "";
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 24px;
          background: var(--branch);
          transform: translateX(-50%);
        }
        /* horizontal connector spanning siblings */
        .tree-children > li::before {
          content: "";
          position: absolute;
          top: -8px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--branch);
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
        /* vertical drop from horizontal line to each child card */
        .tree-children > li::after {
          content: "";
          position: absolute;
          top: -8px;
          left: 50%;
          width: 2px;
          height: 16px;
          background: var(--branch);
          transform: translateX(-50%);
        }
      `}</style>
    </div>
  );
}
