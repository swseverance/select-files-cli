const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

const COMPLETED = 'SELECTION_COMPLETED';
const CANCELLED = 'SELECTION_CANCELLED';
const CHECKMARK = '\u2713';

class FilesSystemService {
  directories(directoryPath, directoryFilter = () => true) {
    return fs.readdirSync(directoryPath).filter((name) => {
      const joinedPath = path.join(directoryPath, name);
      return this.isDirectory(joinedPath) && directoryFilter(joinedPath);
    });
  }

  files(directoryPath, fileFilter = () => true) {
    return fs.readdirSync(directoryPath).filter((name) => {
      const joinedPath = path.join(directoryPath, name);
      return this.isFile(joinedPath) && fileFilter(joinedPath);
    });
  }

  isDirectory(directoryPath) {
    return fs.statSync(directoryPath).isDirectory();
  }

  isFile(filePath) {
    return fs.statSync(filePath).isFile();
  }
}

class FilesSelectionService extends Set {
  constructor(selectedFiles) {
    super(selectedFiles);

    this.lastFileSelected = null;
  }

  get selectedFiles() {
    return Array.from(this);
  }

  isSelected(file) {
    return this.has(file);
  }

  selectFile(file) {
    this.add(file);
    this.lastFileSelected = file;
  }

  removeFile(file) {
    this.delete(file);
  }
}

class LocationService {
  constructor(currentPath) {
    this.currentPath = currentPath;
  }
}

class OptionsService {
  constructor(options) {
    this.options = { ...this.defaultOptions, ...options };
  }

  get defaultOptions() {
    return {
      directoryFilter: () => true,
      fileFilter: () => true,
      root: process.cwd(),
      startingPath: process.cwd(),
      multi: true,
      pageSize: 10,
      selectedFiles: [],
      clearConsole: true,
    };
  }
}

const selectFiles = function (options = {}) {
  const optionsService = new OptionsService(options);
  const locationService = new LocationService(
    optionsService.options.startingPath
  );
  const fileSystemService = new FilesSystemService();
  const filesSelectionService = new FilesSelectionService(
    optionsService.options.selectedFiles
  );

  return new Promise((resolve) => {
    (async function promptUserToSelectFiles() {
      const directories = fileSystemService.directories(
        locationService.currentPath,
        optionsService.options.directoryFilter
      );

      if (locationService.currentPath !== optionsService.options.root) {
        directories.unshift('..');
      }

      const files = fileSystemService.files(
        locationService.currentPath,
        optionsService.options.fileFilter
      );

      const choices = [
        ...directories.map((directoryName) => {
          const value = path.join(locationService.currentPath, directoryName);
          const name = chalk.yellow(directoryName);
          return { value, name };
        }),
        ...files.map((fileName) => {
          const value = path.join(locationService.currentPath, fileName);
          const name = `${fileName} ${
            filesSelectionService.isSelected(value)
              ? chalk.green(CHECKMARK)
              : ''
          }`;
          return { value, name };
        }),
      ];

      if (filesSelectionService.selectedFiles.length) {
        choices.push({
          name: chalk.green('-- File Selection Complete --'),
          value: COMPLETED,
        });
      }

      choices.push({
        name: chalk.red('-- Cancel  File  Selection --'),
        value: CANCELLED,
      });

      if (optionsService.options.clearConsole) {
        console.clear();
      }

      const { selection } = await inquirer.prompt([
        {
          type: 'list',
          message: `Select file(s) in ${locationService.currentPath}`,
          name: 'selection',
          pageSize: optionsService.options.pageSize,
          choices,
          default: () => filesSelectionService.lastFileSelected,
        },
      ]);

      if (optionsService.options.clearConsole) {
        console.clear();
      }

      if (selection === COMPLETED || selection === CANCELLED) {
        return resolve({
          selectedFiles: filesSelectionService.selectedFiles,
          status: selection,
        });
      } else if (!optionsService.options.multi) {
        return resolve({
          selectedFiles: [selection],
          status: COMPLETED,
        });
      }

      if (fileSystemService.isDirectory(selection)) {
        locationService.currentPath = selection;
      } else {
        if (filesSelectionService.isSelected(selection)) {
          filesSelectionService.removeFile(selection);
        } else {
          filesSelectionService.selectFile(selection);
        }
      }

      promptUserToSelectFiles();
    })();
  });
};

module.exports = {
  COMPLETED,
  CANCELLED,
  selectFiles,
};
