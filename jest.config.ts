import type { Config } from "jest"

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  setupFiles: ["dotenv/config"],
  testTimeout: 30000,
  // Transform ESM-only packages (uuid, @supabase) through ts-jest
  transformIgnorePatterns: [
    "node_modules/(?!(uuid|@supabase)/)",
  ],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
    "^.+\\.jsx?$": ["ts-jest", { useESM: false }],
  },
}

export default config
