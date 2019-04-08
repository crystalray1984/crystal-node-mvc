'use strict'

const Controller = require('../controller')
const utils = require('../utils')
const extend2 = require('extend2')
const path = require('path')
const fs = require('fs')

function loadControllers(dirPath, basePath) {
    let names = fs.readdirSync(dirPath)

    let files = []
    let results = []
    names.filter(name => /\.js$/i.test(name)).forEach(name => {
        let content = utils.tryRequire(path.resolve(dirPath, name))
        if (typeof content === 'function' && Controller.isPrototypeOf(content)) {
            let basename = path.basename(name, path.extname(name))
            files.push(basename)
            results.push({
                path: basePath + basename,
                content
            })
        }
    })

    names.filter(name => !/\.js$/i.test(name) && !files.includes(name)).forEach(name => {
        if (!utils.dirExistsSync(path.resolve(dirPath, name))) {
            return
        }

        results = results.concat(loadControllers(path.resolve(dirPath, `./${name}`), basePath + name + '/'))
    })

    return results
}

module.exports = (options, app) => {
    if (!utils.dirExistsSync(app.paths.controllers)) {
        //如果控制器目录不存在，返回一个空的中间件
        return async (ctx, next) => {
            await next()
        }
    }

    options = extend2(true, {
        rootController: 'home',
        defaultAction: 'index'
    }, options)

    let list = loadControllers(app.paths.controllers, '/')
    
    let controllers = list.map(item => {
        return {
            rule: new RegExp('^' + item.path + '(/|$)'),
            content: item.content
        }
    })

    if (typeof options.rootController === 'string' && options.rootController) {
        let rootController = list.find(t => t.path === '/' + options.rootController)
        if (rootController) {
            controllers.unshift({
                rule: /^\/$/,
                content: rootController.content
            })
        }
    }

    return async (ctx, next) => {
        let matchedController = controllers.find(item => item.rule.test(ctx.path))
        if (matchedController) {
            //路由成功
            let controllerPath = matchedController.rule.exec(ctx.path)[0]
            let params = ctx.path.substr(controllerPath.length)
            if (!controllerPath.endsWith('/')) {
                controllerPath += '/'
            }
            if (params.startsWith('/')) {
                params = params.substr(1)
            }

            //拆分路由参数
            params = params.split('/')
            let action = params[0] || options.defaultAction
            params.shift()

            //执行路由方法
            let controller = new matchedController.content(app, ctx)

            if ((await controller.__before(action, params)) !== false) {
                let resp
                if (typeof controller[action] === 'function') {
                    resp = await controller[action].call(controller, params)
                }
                else {
                    resp = await controller.__unknown(action, params)
                }
                if (typeof resp !== 'undefined' && typeof ctx.body === 'undefined') {
                    ctx.body = resp
                }
                await controller.__after(action, params)

                if (ctx.status === 404 && typeof controller[action] === 'function') {
                    ctx.status = 200
                }
            }
        }

        await next()
    }
}