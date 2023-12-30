'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Persona extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Persona.hasMany(models.Course,{
        foreignKey : "teacherId"
      })
      Persona.hasMany(models.Enroll,{
        foreignKey : "teacherId"
      })
      Persona.hasMany(models.Enroll,{
        foreignKey : "studentId"
      })
    }


    static createPersona({firstName,lastName,email,password,role}){
      return this.create({firstName,lastName,email,password,role})
    }
  }
  Persona.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: DataTypes.STRING,
    verified: DataTypes.BOOLEAN
    
  }, {
    sequelize,
    modelName: 'Persona',
  });
  return Persona;
};