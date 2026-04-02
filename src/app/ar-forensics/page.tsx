'use client'

import { Canvas } from '@react-three/fiber'
import { useState } from 'react'

export default function ARForensicsPage() {
  const [filename, setFilename] = useState<string>('')
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">AR Forensics</h1>
      <p className="text-sm text-gray-600">Upload a file and preview overlays.</p>
      <input
        type="file"
        className="block text-sm"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) setFilename(file.name)
        }}
      />
      {filename && <p className="text-xs text-gray-500">Loaded: {filename}</p>}
      <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
        <Canvas>
          <ambientLight />
          <pointLight position={[10, 10, 10]} />
          <mesh rotation={[0.4, 0.8, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color={filename ? 'hotpink' : 'royalblue'} />
          </mesh>
        </Canvas>
      </div>
    </div>
  )
}