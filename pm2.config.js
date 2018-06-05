// Process file configuration for PM2 process runner
// @see http://pm2.keymetrics.io/docs/usage/application-declaration/#process-file

const isDevelopmentMode = (process.env.IS_PRODUCTION == 0);

let apps = [];

apps.push({
    name: "build-watch",
    script: "./build/bundle.js",
    no_daemon: true,
    watch: isDevelopmentMode,
    ignore_watch: ["src", "node_modules", ".git", "dev", "docs", ".log"],
    autorestart: false,
    max_restarts: (isDevelopmentMode ? 1 : null)
});

apps.push({
    name: "build-watch-doc-builder",
    script: "./build-docs.sh",
    watch: isDevelopmentMode,
    ignore_watch: ["src", "node_modules", ".git", "dev", "docs", ".log"],
    no_daemon: true,
    autorestart: false
});

// Perform recompilation only if in development mode
if (isDevelopmentMode) {
    apps.push({
        name: "source-watch",
        script: "./compile.sh",
        no_daemon: true,
        watch: isDevelopmentMode,
        ignore_watch: ["build", "node_modules", ".git", "dev", "docs", ".log"],
        autorestart: false
    });
}

module.exports = {
    apps
};