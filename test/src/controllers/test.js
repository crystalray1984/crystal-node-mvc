'use strict'

const MVC = require('../../../src')

module.exports = class extends MVC.Controller {
    hello() {
        return 'hello'
    }

    index() {
        return 'index'
    }

    __after(action, params) {
        if (typeof this.ctx.body === 'string') {
            this.ctx.body += ' after'
        }
    }
}