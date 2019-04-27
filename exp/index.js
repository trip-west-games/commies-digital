"use strict";
exports.__esModule = true;
var inquirer = require("inquirer");
// const inquirer = require('inquirer')
inquirer.prompt([
    {
        type: 'list',
        name: 'play',
        message: 'Which card do you want to play?',
        choices: [
            {
                name: '3F',
                value: 1
            },
            {
                name: '2B',
                value: 2
            }
        ]
    }
]).then(function (answers) {
    console.log(answers);
});
