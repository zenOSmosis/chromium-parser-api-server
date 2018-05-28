// Process file configuration for PM2 process runner
// @see http://pm2.keymetrics.io/docs/usage/application-declaration/#process-file

module.exports = {
    apps: [{
        name: "src-build",
        script: "yarn/compile.dev.sh",
        watch: true,
        autorestart: false,
        ignore_watch: ["build", "node_modules", ".git"],
        no_daemon: true
    },
    {
        name: "built-app",
        script: "./build/bundle.js",
        watch: true,
        autorestart: true,
        ignore_watch: ["src", "node_modules", ".git"],
        no_daemon: true
    }]
};