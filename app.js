var Sugar = require('sugar');
Sugar.extend();

const Koa = require('koa');
const app = new Koa();

const body = require('koa-json-body')
const cors = require('@koa/cors');

// TODO: Check what limit means and set appropriate limit
app.use(body({ limit: '500kb', fallback: true }))
// TODO: Limit CORS to studio.nearprotocol.com
app.use(cors());

const models = require('./models');
const Op = models.Sequelize.Op;
const randomstring = require('randomstring');
const Router = require('koa-router');
const router = new Router();

const namespace = require('cls-hooked').createNamespace('near-fiddle-api');
models.Sequelize.useCLS(namespace);

// TODO: Extract and publish as separate module as koa-sequelize-transaction is broken
const transactionMiddleware = (ctx, next) => {
    return new Promise((resolve, reject) => {
        namespace.run(() => {
            const transaction = models.sequelize.transaction().then(transaction => {
                namespace.set('transaction', transaction);
                next().then((result) => {
                    transaction.commit();
                    resolve(result);
                }, (e) => {
                    transaction.rollback();
                    reject(e);
                });
            }, reject);
        });
    });
};
app.use(transactionMiddleware);

const withFiddle = async (ctx, next) => {
    ctx.fiddle = await models.Fiddle.findOne({
        where: { name: ctx.params.name },
        include: [{
            model: models.File,
        }],
        order: [[models.File, models.FiddleFile, 'name']]
    });
    if (!ctx.fiddle) {
        ctx.throw(404);
    }
    await next();
}

router.post('/api/fiddle', async ctx => {
    const fiddle = await models.Fiddle.create({
        name: randomstring.generate({ readable: true, length: 7 })
    });
    const filesInRequest = ctx.request.body.files; 
    await fiddle.addOrUpdateFilesFromRequest(filesInRequest);
    ctx.body = {
        success: true,
        message: "Branch " + fiddle.name + " pushed",
        id: fiddle.name
    };
    ctx.status = 201;
});

router.get('/api/fiddle/:name', withFiddle, async ctx => {
    ctx.body = {
        success: true,
        message: "Success",
        id: ctx.fiddle.name,
        files: ctx.fiddle.Files.map(file => {
            return {
                name: file.FiddleFile.name,
                type: file.FiddleFile.type,
                data: file.getDataValue('data').toString('utf8')
            };
        })
    };
});

router.patch('/api/fiddle/:name', withFiddle, async ctx => {
    const filesInRequest = ctx.request.body.files;
    await ctx.fiddle.addOrUpdateFilesFromRequest(filesInRequest);
    ctx.status = 204;
});

app
    .use(router.routes())
    .use(router.allowedMethods());

if (!module.parent) {
    models.sequelize.sync().then(() => {
        app.listen(3000);
    });
} else {
    module.exports = app;
}

