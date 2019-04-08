'use strict'

const extend2 = require('extend2')
const isArray = require('is-array')
const path = require('path')
const fs = require('fs')
const mime = require('mime')

function openFile(fullPath) {
    return new Promise(resolve => {
        fs.stat(fullPath, (err, stat) => {
            if (err) {
                resolve({
                    success: false
                })
            }
            else if (stat.isDirectory()) {
                resolve({
                    success: true,
                    isDirectory: true
                })
            }
            else if (stat.isFile()) {
                resolve({
                    success: true,
                    isDirectory: false
                })
            }
            else {
                resolve({
                    success: false
                })
            }
        })
    })
}

module.exports = (options, app) => {
    options = extend2(true, {
        default: ['index.html']
    }, options)

    return async (ctx, next) => {
        if (ctx.status === 404 && typeof ctx.body === 'undefined') {
            let reqPath = ctx.path
            while (reqPath.startsWith('/')) {
                reqPath = reqPath.substr(1)
            }
            reqPath = path.resolve(app.paths.public, reqPath)

            let firstResult = await openFile(reqPath)

            if (firstResult.success) {
                if (firstResult.isDirectory) {
                    if (!reqPath.endsWith('/')) {
                        reqPath += '/'
                    }

                    let defaultFiles = []
                    if (typeof (options.default) === 'string') {
                        defaultFiles = [options.default]
                    }
                    else if (isArray(options.default)) {
                        defaultFiles = options.default
                    }

                    for (let i = 0; i < defaultFiles.length; i++) {
                        let defaultPath = path.resolve(reqPath, './' + defaultFiles[i])
                        let ret = await openFile(defaultPath)
                        if (ret.success && !ret.isDirectory) {
                            ctx.set('Content-Type', mime.getType(defaultPath))
                            ctx.body = fs.createReadStream(defaultPath, { autoClose: true })
                            break
                        }
                    }
                }
                else {
                    ctx.set('Content-Type', mime.getType(reqPath))
                    ctx.body = fs.createReadStream(reqPath, { autoClose: true })
                }
            }
        }

        await next()
    }
}