'use strict'

const MVC = require('../src')

MVC.run(__dirname, 5555).then(({ app, server }) => {
    console.log(`server runned at http://127.0.0.1:${server.address().port}`)
})