'use strict'

module.exports = () => {
    return async (ctx, next) => {
        const method = ctx.method, url = ctx.url
        const start = Date.now()
        await next()
        const duration = Date.now() - start
        console.log(`[${method}] [${ctx.status}] [${duration}ms] ${url}`)
    }
}