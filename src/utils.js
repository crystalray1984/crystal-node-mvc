'use strict'

const fs = require('fs')

/**
 * 尝试加载一个模块
 * @param {string} name 模块名或路径
 * @param {*} fallback 加载失败时返回的数据
 */
function tryRequire(name, fallback) {
    try {
        return require(name)
    }
    catch (err) {
        if (err instanceof Error && err.code === 'MODULE_NOT_FOUND') {
            return fallback
        }
        throw err
    }
}

/**
 * 尝试从多个路径中加载模块
 * @param  {...string} names 
 */
function requireElse(...names) {
    for (let i = 0; i < names.length; i++) {
        let mod = tryRequire(names[i])
        if (typeof mod !== 'undefined') {
            return mod
        }
    }
}

function dirExistsSync(dirPath) {
    try {
        return fs.statSync(dirPath).isDirectory()
    }
    catch (err) {
        return false
    }
}

module.exports = {
    tryRequire,
    requireElse,
    dirExistsSync
}