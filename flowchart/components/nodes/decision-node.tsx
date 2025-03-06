"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Handle, Position, type NodeProps } from "reactflow"

export default function DecisionNode({ data, isConnectable }: NodeProps) {
  const [label, setLabel] = useState(data.label || "Decision")

  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(evt.target.value)
  }, [])

  return (
    <div className="w-[120px] h-[120px] rotate-45 border-2 border-amber-500 bg-amber-50 flex items-center justify-center">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        style={{ transform: "translateX(0) rotate(-45deg)" }}
      />
      <input
        className="bg-transparent text-center w-full focus:outline-none -rotate-45"
        value={label}
        onChange={onChange}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        style={{ transform: "translateX(0) rotate(-45deg)" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        isConnectable={isConnectable}
        style={{ transform: "translateY(0) rotate(-45deg)" }}
      />
    </div>
  )
}

