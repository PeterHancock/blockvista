import { Suspense } from "react";
import Blocks from "./blocks/Blocks";
import { useSeed } from "./blocks/seed-hook";

function App() {
  const seed = useSeed();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-gray-100 font-mono">
      <h1 className="text-4xl font-bold mb-4">blockvista</h1>
      <Suspense fallback={<div className="text-gray-500">Loading...</div>}>
        <Blocks seed={seed} width={900} height={900} />
      </Suspense>
    </div>
  );
}

export default App;
