'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Course extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Course.belongsTo(models.Persona,{
        foreignKey : "teacherId"
      })

      Course.hasMany(models.Chapter, {
        foreignKey : "courseId"
      })
      
      Course.hasMany(models.Enroll, {
        foreignKey : "courseId"
      })
    }

    static createCourse({ teacherId , courseName,courseDescription }){
      return this.create({ teacherId , courseName,courseDescription })
    }
  }
  Course.init({
    teacherId: DataTypes.INTEGER,
    courseName: DataTypes.STRING,
    courseDescription: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'Course',
  });
  return Course;
};