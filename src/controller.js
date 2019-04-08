'use strict'

const Processor = require('./processor')

module.exports = class Controller extends Processor {
    constructor(app, ctx) {
        super(app)
        this.ctx = ctx
    }

    __before(action) {
        return Promise.resolve(true)
    }

    __after(action) {
        return Promise.resolve()
    }

    __unknown(action, params) {
        return Promise.resolve()
    }
}