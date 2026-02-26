import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
};

export default withSerwist(nextConfig);
