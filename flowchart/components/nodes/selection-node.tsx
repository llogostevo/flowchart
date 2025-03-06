"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Trash2 } from "lucide-react"

export default function SelectionNode({ data, isConnectable, selected }: NodeProps) {
  const [label, setLabel] = useState(data.label || "Selection")

  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(evt.target.value)
  }, [])

  return (
    <div className="relative">
      <div
        className="w-[120px] h-[120px] border-2 border-amber-500 bg-amber-50 flex items-center justify-center"
        style={{ clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)" }}
      >
        <Handle type="target" position={Position.Top} id="top" isConnectable={isConnectable} style={{ top: 0 }} />
        <input className="bg-transparent text-center w-full focus:outline-none" value={label} onChange={onChange} />
        <Handle type="source" position={Position.Left} id="left" isConnectable={isConnectable} style={{ left: 0 }} />
        <Handle type="source" position={Position.Right} id="right" isConnectable={isConnectable} style={{ right: 0 }} />

        {selected && (
          <button
            className="absolute -top-10 right-0 p-1 bg-red-100 rounded-full hover:bg-red-200"
            onClick={() => data.onDelete?.()}
          >
            <Trash2 className="h-5 w-5 text-red-600" />
          </button>
        )}
      </div>
    </div>
  )
}

