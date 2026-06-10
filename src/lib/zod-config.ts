import { z } from "zod";

// CSP: production script-src has no 'unsafe-eval'. Zod v4's JIT validator probes
// `Function("")` at the first object-schema construction; the CSP blocks it, emitting
// one console violation per page load (Zod then falls back to interpreted validation).
// `jitless` disables JIT codegen entirely, removing the probe. This side-effect must
// run before any `z.object()` is constructed, so every schema module imports it first.
z.config({ jitless: true });
