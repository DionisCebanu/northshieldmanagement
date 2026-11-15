process.env.NODE_ENV ??= "production";

await import("./apps/web/server.ts");
