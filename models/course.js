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
    }

    static createCourse({ teacherId , courseName,courseDescription }){
      return this.create({ teacherId , courseName,courseDescription })
    }
  }
  Course.init({
    teacherId: DataTypes.INTEGER,
    courseName: DataTypes.STRING,
    courseDescription: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Course',
  });
  return Course;
};