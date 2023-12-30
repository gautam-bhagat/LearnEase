'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Enroll extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Enroll.belongsTo(models.Page,{
        foreignKey : "pageId"
      })
      Enroll.belongsTo(models.Chapter,{
        foreignKey : "chapterId"
      })
      Enroll.belongsTo(models.Course,{
        foreignKey : "courseId"
      })
      Enroll.belongsTo(models.Persona,{
        foreignKey : "studentId"
      })
      Enroll.belongsTo(models.Persona,{
        foreignKey : "teacherId"
      })
      
    }
  }
  Enroll.init({
    studentId: DataTypes.INTEGER,
    teacherId: DataTypes.INTEGER,
    courseId: DataTypes.INTEGER,
    chapterId: DataTypes.INTEGER,
    pageId: DataTypes.INTEGER,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Enroll',
  });
  return Enroll;
};