'use strict'

const Application = require('./application')
const Controller = require('./controller')
const http = require('http')

function run(root, ...ports) {
    if (!root) {
        throw new Error('root is required')
    }
    let app
    if (root instanceof Application) {
        app = root
    }
    else if (typeof root === 'string') {
        app = new Application(root)
    }
    else {
        throw new Error('root is required')
    }

    let ps = ports.filter(port => typeof port === 'number' && !isNaN(port) && port > 0)
    if (ps.length === 0 && typeof app.config.port === 'number' && app.config.port > 0) {
        ps.push(app.config.port)
    }

    if (ps.length === 0) {
        const server = http.createServer(app.callback())
        return new Promise(resolve => {
            try {
                server.listen(() => {
                    resolve({ app, server })
                })
            }
            catch (err) {
                reject(err)
                process.exit()
            }
        })
    }
    else if (ps.length === 1) {
        const server = http.createServer(app.callback())
        return new Promise(resolve => {
            try {
                server.listen(ps[0], () => {
                    resolve({ app, server })
                })
            }
            catch (err) {
                reject(err)
                process.exit()
            }
        })
    }
    else {
        return new Promise((resolve, reject) => {
            Promise.all(ps.map(port => {
                const server = http.createServer(app.callback())
                return new Promise((resolve, reject) => {
                    try {
                        server.listen(port, () => {
                            resolve(server)
                        })
                    }
                    catch (err) {
                        reject(err)
                    }
                })
            })).then(servers => {
                resolve({ app, servers })
            }).catch(err => {
                reject(err)
                process.exit()
            })
        })
    }
}

module.exports.Application = Application
module.exports.Controller = Controller
module.exports.run = run