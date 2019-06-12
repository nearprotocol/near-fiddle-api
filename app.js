var Sugar = require('sugar');
Sugar.extend();

const Koa = require('koa');
const app = new Koa();
app.keys = [ process.env.FIDDLE_SECRET_KEY || 'verysecretkey'];

const body = require('koa-json-body');
const cors = require('@koa/cors');

app.use(body({ limit: '3Mb', fallback: true }));
if (process.NODE_ENV != 'production') {
    app.use(cors({ credentials: true }));
}

const models = require('./models');
const randomstring = require('randomstring');
const path = require('path');
const Router = require('koa-router');
const router = new Router();

const namespace = require('cls-hooked').createNamespace('near-fiddle-api');
models.Sequelize.useCLS(namespace);

// TODO: Extract and publish as separate module as koa-sequelize-transaction is broken
const transactionMiddleware = (ctx, next) => {
    return new Promise((resolve, reject) => {
        namespace.run(() => {
            models.sequelize.transaction().then(transaction => {
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
const sessionStore = new SequelizeStore(models.sequelize, {
    maxAge: 90 * 24 * 60 * 60 * 1000 // 90 days in ms
});

app.use(session({ store: sessionStore }));

const createFiddle = async (ctx, next) => {
    ctx.fiddle = await models.Fiddle.create({
        name: randomstring.generate({ readable: true, length: 9 , capitalization: 'lowercase' })
    });
    await next();
};

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
};

const updateFiddleFiles = async (ctx, next) => {
    const filesInRequest = ctx.request.body.files;
    await ctx.fiddle.addOrUpdateFilesFromRequest(filesInRequest);
    await next();
};

const grantFiddleAccess = async (ctx, next) => {
    ctx.session.ownedFiddles = ctx.session.ownedFiddles || [];
    ctx.session.ownedFiddles = ctx.session.ownedFiddles.concat([ctx.fiddle.name]);
    await next();
};

const checkFiddleAccess = async (ctx, next) => {
    ctx.fiddleEditable = !!(ctx.session.ownedFiddles && ctx.session.ownedFiddles.find(ctx.fiddle.name));
    await next();
};

router.post('/api/fiddle', createFiddle, updateFiddleFiles, grantFiddleAccess, async ctx => {
    ctx.body = {
        success: true,
        message: 'Branch ' + ctx.fiddle.name + ' pushed',
        id: ctx.fiddle.name
    };
    ctx.status = 201;
});

router.get('/api/fiddle/:name', withFiddle, checkFiddleAccess, async ctx => {
    ctx.body = {
        success: true,
        message: 'Success',
        editable: ctx.fiddleEditable,
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

const servePage = async ctx => {
    let fiddle = await models.Fiddle.findOne({
        where: { name: ctx.params.name }
    });

    const loadFile = filePath => models.FiddleFile.findOne({
        where: { FiddleId: fiddle.id, name: filePath },
        include: { model: models.File }
    });

    let filePath = `src/${ctx.params.path || 'index.html'}`;
    let file = await loadFile(filePath);
    if (!file) {
        // Needed for old fiddles
        // TODO: Remove at prod launch
        if (!ctx.params.path) {
            filePath = 'src/main.html';
            file = await loadFile(filePath);
        }

        if (!file) {
            ctx.throw(404);
        }
    }

    ctx.body = file.File.getDataValue('data').toString('utf8');
    ctx.type = path.extname(filePath);

    ctx.cookies.set('fiddleConfig', encodeURIComponent(JSON.stringify({
        nearPages: true,
        contractName: ctx.query.contractName || `studio-${ctx.params.name}`,
        appUrl: `${process.env.APP_URL || 'https://app.near.ai'}/${ctx.params.name}`,
        baseUrl: process.env.CONTRACT_HELPER_URL || 'https://studio.nearprotocol.com/contract-api',
        nodeUrl: process.env.NODE_URL || 'https://studio.nearprotocol.com/devnet',
        walletUrl: process.env.WALLET_URL || 'https://wallet.nearprotocol.com'
    })), { signed: false, httpOnly: false });
};

router.get('/app/:name', servePage);
router.get('/app/:name/:path(.*)', servePage);


app
    .use(router.routes())
    .use(router.allowedMethods());

if (!module.parent) {
    models.sequelize.sync().then(() => {
        app.listen(3000);
    });
} else {
    module.exports = app;
    app.sessionStore = sessionStore;
}

