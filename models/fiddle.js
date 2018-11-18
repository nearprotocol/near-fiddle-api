'use strict';
module.exports = (sequelize, DataTypes) => {
  const Fiddle = sequelize.define('Fiddle', {
    name: DataTypes.STRING
  }, {});
  Fiddle.associate = function(models) {
    models.File.belongsToMany(Fiddle, { through: models.FiddleFile });
    Fiddle.belongsToMany(models.File, { through: models.FiddleFile });
  };
  return Fiddle;
};