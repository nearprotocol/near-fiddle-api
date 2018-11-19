'use strict';
module.exports = (sequelize, DataTypes) => {
  const Fiddle = sequelize.define('Fiddle', {
    name: { type: DataTypes.STRING, unique: true },
  }, {});
  Fiddle.associate = function(models) {
    models.File.belongsToMany(Fiddle, { through: models.FiddleFile });
    Fiddle.belongsToMany(models.File, { through: models.FiddleFile });
  };
  return Fiddle;
};