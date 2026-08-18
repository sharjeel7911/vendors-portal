import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Silence the workspace-root inference warning: this repo has a root-level
  // package-lock.json (shared lint/scripts) in addition to this one.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
