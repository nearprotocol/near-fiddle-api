var Sugar = require('sugar');
Sugar.extend();

const Koa = require('koa');
const app = new Koa();
app.keys = [ process.env.FIDDLE_SECRET_KEY || "verysecretkey"];

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

const session = require('koa-generic-session');
const SequelizeStore = require('koa-generic-session-sequelize');
app.use(session({
  store: new SequelizeStore(models.sequelize, {})
}));

const createFiddle = async (ctx, next) => {
    ctx.fiddle = await models.Fiddle.create({
        name: randomstring.generate({ readable: true, length: 7 })
    });
    await next();
}

const withFiddle = async (ctx, next) => {
    ctx.fiddle = await models.Fiddle.findOne({
        where: { name: ctx.params.name },
        include: [{
            model: models.FiddleFile,
            include: {
                model: models.File
            }
        }],
        order: [[models.FiddleFile, 'name']]
    });
    if (!ctx.fiddle) {
        ctx.throw(404);
    }
    await next();
}

const updateFiddleFiles = async (ctx, next) => {
    const filesInRequest = ctx.request.body.files; 
    await ctx.fiddle.addOrUpdateFilesFromRequest(filesInRequest);
    await next();
}

const grantFiddleAccess = async (ctx, next) => {
    ctx.session.ownedFiddles = ctx.session.ownedFiddles || [];
    ctx.session.ownedFiddles = ctx.session.ownedFiddles.concat([ctx.fiddle.name]);
    await next();
}

const checkFiddleAccess = async (ctx, next) => {
    ctx.fiddleEditable = ctx.session.ownedFiddles && ctx.session.ownedFiddles.find(ctx.fiddle.name);
    await next();
}

router.post('/api/fiddle', createFiddle, updateFiddleFiles, grantFiddleAccess, async ctx => {
    ctx.body = {
        success: true,
        message: "Branch " + ctx.fiddle.name + " pushed",
        id: ctx.fiddle.name
    };
    ctx.status = 201;
});

router.get('/api/fiddle/:name', withFiddle, checkFiddleAccess, async ctx => {
    ctx.body = {
        success: true,
        message: "Success",
        id: ctx.fiddle.name,
        files: ctx.fiddle.FiddleFiles.map(file => {
            return {
                name: file.name,
                type: file.type,
                data: file.File.getDataValue('data').toString('utf8')
            };
        })
    };
});

router.patch('/api/fiddle/:name', withFiddle, checkFiddleAccess, updateFiddleFiles, async ctx => {
    if (!ctx.fiddleEditable) {
        ctx.throw(403);
    }
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

