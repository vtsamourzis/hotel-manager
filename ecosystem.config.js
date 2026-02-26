module.exports = {
  apps: [
    {
      name: "hotel-manager",
      script: ".next/standalone/server.js",
      cwd: "/opt/hotel-manager",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
}
