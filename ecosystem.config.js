module.exports = {
  apps: [
    {
      name: "hotel-manager",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      cwd: "/opt/hotel-manager",
      instances: 1,
      exec_mode: "fork",
      node_args: "-r dotenv/config",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
      },
    },
  ],
}
