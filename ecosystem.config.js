module.exports = {
  apps: [
    {
      name: "hotel-manager",
      script: "node_modules/.bin/next",
      args: "start",
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
