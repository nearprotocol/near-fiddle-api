var Sugar = require('sugar');
Sugar.extend();

const Koa = require('koa');
const app = new Koa();

const body = require('koa-json-body')
 
app.use(body({ limit: '10kb', fallback: true }))
 
app.use(ctx => {
    console.log(ctx.request.body)
    ctx.body = {"success":true,"message":"Branch kmel5d9jgjl pushed","id":"kmel5d9jgjl"};
});
 
app.listen(3000);
