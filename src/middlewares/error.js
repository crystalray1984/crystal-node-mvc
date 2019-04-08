'use strict'

module.exports = () => {
    return async (ctx, next) => {
        try {
            await next()
        }
        catch (err) {
            console.error(err)
            ctx.status = 500
        }
    }
}