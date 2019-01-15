'use strict';
module.exports = (sequelize, DataTypes) => {
    const File = sequelize.define('File', {
        hash: { type: DataTypes.STRING, unique: true },
        data: DataTypes.BLOB
    }, {});
    // eslint-disable-next-line no-unused-vars
    File.associate = function(models) {
        // associations can be defined here
    };
    return File;
};