"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Trash2 } from "lucide-react"

export default function StartEndNode({ data, isConnectable, selected }: NodeProps) {
  const [label, setLabel] = useState(data.label || "Start/End")

  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(evt.target.value)
  }, [])

  return (
    <div className="relative">
      <div className="px-4 py-2 rounded-full border-2 border-blue-500 bg-blue-50 min-w-[120px] text-center">
        <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
        <input className="bg-transparent text-center w-full focus:outline-none" value={label} onChange={onChange} />
        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />

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

