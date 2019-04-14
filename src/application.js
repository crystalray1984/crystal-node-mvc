'use strict'

const Koa = require('koa')
const path = require('path')
const extend2 = require('extend2')
const utils = require('./utils')
const isArray = require('is-array')

class Application extends Koa {
    constructor(root) {
        super()

        //初始化路径对象
        root = path.resolve(root)
        this.paths = {
            root,
            src: path.resolve(root, './src'),
            config: path.resolve(root, './src/config'),
            init: path.resolve(root, './src/init'),
            db: path.resolve(root, './src/db'),
            middlewares: path.resolve(root, './src/middlewares'),
            controllers: path.resolve(root, './src/controllers'),
            public: path.resolve(root, './public')
        }

        //加载配置文件
        this.initConfig()
        
        //加载中间件
        this.initMiddlewares()

        //加载数据库连接对象
        this.initDb()
    }

    initConfig() {
        this.config = utils.tryRequire(this.paths.config) || {}
        //加载环境特定配置文件
        this.config = extend2(true, this.config, utils.tryRequire(path.resolve(this.paths.config, `./${this.env}`)) || {})
    }

    initMiddlewares() {
        let middlewares = this.config.middlewares
        if (!isArray(middlewares)) {
            //设置默认的中间件
            middlewares = [
                'request-log',
                'error',
                'post-body',
                'action',
                'static'
            ]
        }

        middlewares.forEach(config => {
            if (typeof config === 'string') {
                config = {
                    handler: config
                }
            }

            let handler, options, match, instance

            if (typeof config.handler === 'string') {
                handler = utils.requireElse(
                    path.resolve(this.paths.middlewares, `./${config.handler}`),
                    path.resolve(__dirname, `./middlewares/${config.handler}`),
                    config.handler
                )
            }
            else {
                handler = config.handler
            }

            if (typeof handler !== 'function') {
                throw new Error('middleware handler must be function.')
            }

            if (typeof config.options === 'function') {
                options = config.options(this)
            }
            else {
                options = config.options
            }

            instance = handler(options, this)

            this.use(async (ctx, next) => {
                if (typeof config.match === 'undefined') {
                    match = () => true
                }
                else if (typeof config.match === 'string') {
                    match = () => {
                        ctx.path.startsWith(config.match)
                    }
                }
                else if (typeof config.match === 'boolean' || typeof config.match === 'number') {
                    match = () => !!config.match
                }
                else if (typeof config.match === 'function') {
                    match = config.match    
                }
                else if (config.match === null) {
                    match = () => false
                }
                else if (config.match instanceof RegExp) {
                    match = () => config.match.test(ctx.path)
                }
                else {
                    match = () => true
                }

                if (match(ctx)) {
                    //执行中间件的操作
                    await instance(ctx, next)
                }
                else {
                    await next()
                }
            })
        })
    }

    initDb() {
        this.db = {}
        if (this.config.db) {
            for (let n in this.config.db) {
                let options = this.config.db[n]
                if (options === true) {
                    this.db[n] = this.connectDbPool(n)
                }
                else {
                    this.db[n] = this.connectDbPool(n, options)
                }
            }
        }
    }

    connectDb(type, options) {
        let factory = utils.requireElse(
            path.resolve(this.paths.db, `./${type}`),
            `crystal-node-${type}`
        )

        if (typeof factory !== 'function') {
            throw new Error(`Database type ${type} not support`)
        }

        return factory(options)
    }

    connectDbPool(type, options) {
        let factory = utils.requireElse(
            path.resolve(this.paths.db, `./${type}`),
            `crystal-node-${type}`
        )

        if (typeof factory !== 'function') {
            throw new Error(`Database type ${type} not support`)
        }

        if (typeof factory.createPool === 'function') {
            return factory.createPool(options)
        }
        else {
            return factory(options)
        }
    }
}

module.exports = Application