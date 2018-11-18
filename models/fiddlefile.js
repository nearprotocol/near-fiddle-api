'use strict';
module.exports = (sequelize, DataTypes) => {
  const FiddleFile = sequelize.define('FiddleFile', {
    name: DataTypes.STRING,
    type: DataTypes.STRING
  }, {});
  FiddleFile.associate = function(models) {
    // associations can be defined here
  };
  return FiddleFile;
};