var Sugar = require('sugar');
Sugar.extend();

const Koa = require('koa');
const app = new Koa();

const body = require('koa-json-body')

// TODO: Check what limit means and set appropriate limit
app.use(body({ limit: '10kb', fallback: true }))

const models = require('./models');
const Op = models.Sequelize.Op;
const crypto2 = require('crypto2');
const randomstring = require('randomstring');
const Router = require('koa-router');
const router = new Router();

router.post('/api/set-fiddle', async ctx => {
    const fiddle = await models.Fiddle.create({
        name: randomstring.generate({ readable: true, length: 7 })
    });
    await ctx.request.body.files.map(async fileInRequest => {
        const [file, _] = await models.File.findOrCreate({
           where: {
               hash: await crypto2.hash.sha256(fileInRequest.data)
           },
           defaults: {
               data: fileInRequest.data
           }
        });
        await fiddle.addFile(file, { through: { name: fileInRequest.name, type: fileInRequest.type } });
    });
    ctx.body = {
        success: true,
        message: "Branch " + fiddle.name + " pushed",
        id: fiddle.name
    };
});

router.get('/api/fiddle/:name', async ctx => {
    const fiddle = await models.Fiddle.findOne({
        where: { name: ctx.params.name },
        include: [{
            model: models.File
        }]
    });
    console.log("fiddle", fiddle);
    ctx.body = {
        success: true,
        message: "Success",
        id: fiddle.name,
        files: fiddle.Files.map(file => {
            return {
                name: file.FiddleFile.name,
                data: file.getDataValue('data').toString('utf8')
            };
        })
    };
});

app
    .use(router.routes())
    .use(router.allowedMethods());

models.sequelize.sync().then(() => {
    app.listen(3000);
});
  
