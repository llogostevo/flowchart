import { Handle, Position, type NodeProps } from "reactflow"

const SelectionNode = ({ data, isConnectable }: NodeProps) => {
  return (
    <div className="shadow-md bg-white border-2 border-gray-300 w-[120px] h-[120px] flex items-center justify-center rotate-45">
      <div className="-rotate-45 text-center">
        <Handle
          type="target"
          position={Position.Top}
          isConnectable={isConnectable}
          style={{ transform: "translateX(0) rotate(-45deg)" }}
        />
        <div contentEditable suppressContentEditableWarning className="font-bold outline-none">
          {data.label}
        </div>
        <Handle
          type="source"
          position={Position.Bottom}
          isConnectable={isConnectable}
          style={{ transform: "translateX(0) rotate(-45deg)" }}
        />
        <Handle
          type="source"
          position={Position.Left}
          id="true"
          isConnectable={isConnectable}
          style={{ transform: "translateY(0) rotate(-45deg)" }}
        />
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          isConnectable={isConnectable}
          style={{ transform: "translateY(0) rotate(-45deg)" }}
        />
      </div>
    </div>
  )
}

export default SelectionNode

