'use strict';
const crypto2 = require('crypto2');

module.exports = (sequelize, DataTypes) => {
  const Fiddle = sequelize.define('Fiddle', {
    name: { type: DataTypes.STRING, unique: true },
  }, {});
  Fiddle.associate = function(models) {
    models.File.belongsToMany(Fiddle, { through: models.FiddleFile });
    Fiddle.belongsToMany(models.File, { through: models.FiddleFile });
  };
  Fiddle.prototype.addOrUpdateFileFromRequest = async function (fileInRequest) {
    const [file, _] = await sequelize.models.File.findOrCreate({
      where: {
        hash: await crypto2.hash.sha256(fileInRequest.data)
      },
      defaults: {
        data: fileInRequest.data
      }
    });
    if (this.Files) {
      const fileToReplace = this.Files.find(file => file.FiddleFile.name === fileInRequest.name);
      await this.removeFile(fileToReplace);
    }
    await this.addFile(file, { through: { name: fileInRequest.name, type: fileInRequest.type } });
  };
  Fiddle.prototype.addOrUpdateFilesFromRequest = async function(filesInRequest) {
    if (Array.isArray(filesInRequest)) {
        await Promise.all(
            filesInRequest.map(
                this.addOrUpdateFileFromRequest.bind(this)));
    }
  };
  return Fiddle;
};