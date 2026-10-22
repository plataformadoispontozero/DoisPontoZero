import { Buffer } from 'buffer'

// @react-pdf/image uses the Node Buffer API to decode PNG/JPEG bytes even in
// its browser graph. Load the browser implementation before renderer imports.
const runtime = globalThis as typeof globalThis & { Buffer?: typeof Buffer }
if (!runtime.Buffer) runtime.Buffer = Buffer
