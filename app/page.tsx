import FlowchartTeachingTool from "@/components/flowchart-teaching-tool"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Flowchart Teaching Tool</h1>
      <div className="w-full h-[calc(100vh-150px)]">
        <FlowchartTeachingTool />
      </div>
    </main>
  )
}

