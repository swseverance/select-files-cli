const { selectFiles, COMPLETED, CANCELLED } = require('.');

selectFiles({
  directoryFilter: (directoryName) => {
    return !/node_modules$/gi.test(directoryName);
  },
  pageSize: 15,
}).then(({ selectedFiles, status }) => {
  if (status === COMPLETED) {
    console.log('File selection completed!');
  } else if (status === CANCELLED) {
    console.log('File selection cancelled!');
  }
  console.log('selectedFiles', selectedFiles);
});
