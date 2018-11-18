'use strict';
module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    hash: DataTypes.STRING,
    data: DataTypes.BLOB
  }, {});
  File.associate = function(models) {
    // associations can be defined here
  };
  return File;
};