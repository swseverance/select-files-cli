const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

const defaultOptions = {
  directoryFilter: () => true,
  fileFilter: () => true,
  root: process.cwd(),
  startingPath: process.cwd(),
  multi: true,
  pageSize: 10,
  selectedFiles: [],
  clearConsole: true,
};
const COMPLETED = 'SELECTION_COMPLETED';
const CANCELLED = 'SELECTION_CANCELLED';
const CHECKMARK = '\u2713';

const isDirectory = (path) => fs.statSync(path).isDirectory();
const isFile = (path) => fs.statSync(path).isFile();

const selectFiles = function (options = {}) {
  options = { ...defaultOptions, ...options };

  const selectedFiles = new Set(options.selectedFiles);
  let currentPath = options.startingPath;
  let lastFileSelected = null;

  return new Promise((resolve) => {
    (function promptUserToSelectFiles() {
      const directories = currentPath === options.root ? [] : ['..'];
      const files = [];

      fs.readdirSync(currentPath).forEach((name) => {
        const directoryOrFilePath = path.join(currentPath, name);
        if (
          isDirectory(directoryOrFilePath) &&
          options.directoryFilter(directoryOrFilePath)
        ) {
          directories.push(name);
        } else if (
          isFile(directoryOrFilePath) &&
          options.fileFilter(directoryOrFilePath)
        ) {
          files.push(name);
        }
      });

      const choices = [
        ...directories.map((directoryName) => {
          const value = path.join(currentPath, directoryName);
          const name = chalk.yellow(directoryName);
          return { value, name };
        }),
        ...files.map((fileName) => {
          const value = path.join(currentPath, fileName);
          const name = `${fileName} ${
            selectedFiles.has(value) ? chalk.green(CHECKMARK) : ''
          }`;
          return { value, name };
        }),
      ];

      if (selectedFiles.size) {
        choices.push({
          name: chalk.green('-- File Selection Complete --'),
          value: COMPLETED,
        });
      }

      choices.push({
        name: chalk.red('-- Cancel File Selection --'),
        value: CANCELLED,
      });

      if (options.clearConsole) {
        console.clear();
      }

      inquirer
        .prompt([
          {
            type: 'list',
            message: `Select file(s) in ${currentPath}`,
            name: 'selection',
            pageSize: options.pageSize,
            choices,
            default: () => lastFileSelected,
          },
        ])
        .then(({ selection }) => {
          if (options.clearConsole) {
            console.clear();
          }

          if (selection === COMPLETED || selection === CANCELLED) {
            return resolve({
              selectedFiles: Array.from(selectedFiles),
              status: selection,
            });
          } else if (!options.multi) {
            return resolve({
              selectedFiles: [selection],
              status: COMPLETED,
            });
          }

          if (isDirectory(selection)) {
            currentPath = selection;
            lastFileSelected = null;
          } else {
            if (selectedFiles.has(selection)) {
              selectedFiles.delete(selection);
            } else {
              selectedFiles.add(selection);
            }
            lastFileSelected = selection;
          }

          promptUserToSelectFiles();
        });
    })();
  });
};

module.exports = {
  COMPLETED,
  CANCELLED,
  selectFiles,
};
