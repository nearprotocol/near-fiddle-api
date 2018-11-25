'use strict';
const crypto2 = require('crypto2');

module.exports = (sequelize, DataTypes) => {
  const Fiddle = sequelize.define('Fiddle', {
    name: { type: DataTypes.STRING, unique: true },
  }, {});
  Fiddle.associate = function(models) {
    Fiddle.hasMany(models.FiddleFile);
    models.FiddleFile.belongsTo(Fiddle);
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
    if (this.FiddleFiles) {
      const fileToReplace = this.FiddleFiles.find(file => file.name === fileInRequest.name);
      if (fileToReplace) {
        await fileToReplace.destroy();
      }
    }
    await sequelize.models.FiddleFile.create({
      FiddleId: this.id,
      FileId: file.id,
      name: fileInRequest.name,
      type: fileInRequest.type
    });
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