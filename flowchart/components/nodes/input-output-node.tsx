"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Trash2 } from "lucide-react"

export default function InputOutputNode({ data, isConnectable, selected }: NodeProps) {
  const [label, setLabel] = useState(data.label || "Input/Output")

  const onChange = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    setLabel(evt.target.value)
  }, [])

  return (
    <div className="relative">
      <div className="relative min-w-[120px] h-[60px]">
        {/* This creates the parallelogram shape with right tilt */}
        <div className="absolute inset-0 bg-purple-50 border-2 border-purple-500 skew-x-12"></div>

        {/* Content container with horizontal text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <input
            className="bg-transparent text-center w-full focus:outline-none z-10"
            value={label}
            onChange={onChange}
          />
        </div>

        <Handle type="target" position={Position.Top} isConnectable={isConnectable} style={{ zIndex: 20 }} />
        <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} style={{ zIndex: 20 }} />

        {selected && (
          <button
            className="absolute -top-10 right-0 p-1 bg-red-100 rounded-full hover:bg-red-200 z-20"
            onClick={() => data.onDelete?.()}
          >
            <Trash2 className="h-5 w-5 text-red-600" />
          </button>
        )}
      </div>
    </div>
  )
}

