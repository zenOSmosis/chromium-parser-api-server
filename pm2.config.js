// Process file configuration for PM2 process runner
// @see http://pm2.keymetrics.io/docs/usage/application-declaration/#process-file

module.exports = {
    apps: [{
        name: "source-watch",
        script: "./compile.sh",
        no_daemon: true,
        ignore_watch: ["build", "node_modules", ".git", "dev", "docs"],
        watch: true,
        autorestart: false
    },
    {
        name: "build-watch",
        script: "./build/bundle.js",
         no_daemon: true,
        // TODO: Enable this to autorestart, always, and not watch, if not in development mode
        watch: true,
        ignore_watch: ["src", "node_modules", ".git", "dev", "docs"],
        autorestart: false,
        max_restarts: 1
    },
    {
        name: "build-watch-doc-builder",
        script: "./build-docs.sh",
        watch: true,
        ignore_watch: ["src", "node_modules", ".git", "dev", "docs"],
        no_daemon: true,
        autorestart: false
    }]
};