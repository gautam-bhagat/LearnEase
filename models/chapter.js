'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Chapter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Chapter.belongsTo(models.Course,{
        foreignKey : "courseId"
      })

      Chapter.hasMany(models.Page,{
        foreignKey : "chapterId"
      })
      
    }

    static createChapter({ courseId, chapterName, chapterDescription }){

      return this.create({ courseId, chapterName, chapterDescription })
    }
  }
  Chapter.init({
    courseId: DataTypes.INTEGER,
    chapterName: DataTypes.STRING,
    chapterDescription: DataTypes.STRING(255)
  }, {
    sequelize,
    modelName: 'Chapter',
  });
  return Chapter;
};