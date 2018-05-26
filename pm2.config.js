// Process file configuration for PM2 process runner
// @see http://pm2.keymetrics.io/docs/usage/application-declaration/#process-file

module.exports = {
    apps: [{
        name: "puppeteer-app",
        script: "./src/index.js",
        watch: true,
        ignore_watch: ["node_modules", ".git"],
        no_daemon: true
    }]
};