'use strict';
module.exports = (sequelize, DataTypes) => {
    const FiddleFile = sequelize.define('FiddleFile', {
        FiddleId: { type: DataTypes.INTEGER, primaryKey: true },
        FileId: { type: DataTypes.INTEGER, primaryKey: true },
        name: { type: DataTypes.STRING, primaryKey: true },
        type: DataTypes.STRING
    }, {});
    FiddleFile.associate = function(models) {
        FiddleFile.belongsTo(models.File);
    };
    return FiddleFile;
};