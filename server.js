/*
 * @Descripttion: 
 * @version: 
 * @Author: houqiangxie
 * @Date: 2022-05-23 10:20:59
 * @LastEditors: houqiangxie
 * @LastEditTime: 2022-06-06 17:11:19
 */
var express = require('express');
var proxy = require('express-http-proxy')


const app = express();

app.all('*', function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    // res.setHeader("Content-Type", "application/json;charset=utf-8");
    next();
})

app.use('/api', proxy('http://172.17.136.54:30022/', {
    // forwardPath: function(req, res) {
    //   debugger
    //   return require('url').parse(req.url).path;
    // }
}))

app.use(express.static('dist'))

app.listen('80')