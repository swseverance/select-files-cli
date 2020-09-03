# select-files-cli

>A library designed for selecting one or more files via the command line

## Basic Usage

```javascript
const { selectFiles } = require('select-files-cli');

selectFiles().then(({ selectedFiles, status }) => {
  console.log(selectedFiles);

  // [
  //  '/Users/sam/Documents/select-files-cli/README.md',
  //  '/Users/sam/Documents/select-files-cli/index.js'
  // ]

  console.log(status);

  // 'SELECTION_COMPLETED' (or 'SELECTION_CANCELLED')
});
```

<img
  src="https://github.com/swseverance/select-files-cli/raw/master/cli.png" alt="select-files-cli">

## Advanced Usage

```javascript
selectFiles(options).then(...);
```

### Options

* `pageSize`: int
    * Default value is `10`
* `multi`: boolean
    * Defaults to `true` to allow for selection of multiple files
* `selectedFiles`: string[]
    * Files that will initially be selected
* `clearConsole`: boolean
    * Defaults to `true`
*  `startingPath`: string
    * Where the user will initially be prompted to select files
    * Defaults to `process.cwd()`
*  `root`: string
    * The top level directory the user has access to
    * Defaults to `process.cwd()`
*  `directoryFilter`: function => boolean
    * Return `false` for any directory that you do not want to appear in the cli
```javascript
  directoryFilter: (directoryName) => {
    return !/node_modules$/gi.test(directoryName);
  },
```
*  `fileFilter`: function => boolean
    * Return `false` for any file that you do not want to appear in the cli
```javascript
  fileFilter: (fileName) => {
    return !/index.js$/gi.test(fileName);
  },
```

## License

MIT
