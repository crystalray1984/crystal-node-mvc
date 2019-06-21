'use strict'

const body = require('koa-body')
const extend2 = require('extend2')
const fs = require('fs')

module.exports = (options) => {
    options = extend2(true, { multipart: true}, options)

    const bodyParser = body(options)

    return async (ctx, next) => {
        if (ctx.method === 'POST' || ctx.method === 'PUT') {
            let error
            try {
                await bodyParser(ctx, next)
            }
            catch (err) {
                error = err
            }
            finally {
                //清理上传的文件
                if (ctx.request.files) {
                    for (let n in ctx.request.files) {
                        fs.unlink(ctx.request.files[n].path, () => { })
                    }
                }
            }
            if (error) {
                throw error
            }
        }
        else {
            await next()
        }
    }
}