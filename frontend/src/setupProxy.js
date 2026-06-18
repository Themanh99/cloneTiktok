const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'https://tiktok.fullstack.edu.vn',
            changeOrigin: true,
            secure: true,
        }),
    );
};
