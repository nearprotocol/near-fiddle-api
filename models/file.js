'use strict';
module.exports = (sequelize, DataTypes) => {
  const File = sequelize.define('File', {
    hash: { type: DataTypes.STRING, unique: true },
    data: DataTypes.BLOB
  }, {});
  File.associate = function(models) {
    // associations can be defined here
  };
  return File;
};