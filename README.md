
# Simple Archiver

[![Build Status](https://travis-ci.org/kesarion/simple-archiver.svg?branch=master)](https://travis-ci.org/kesarion/simple-archiver)

Archive multiple files, directories, buffers, streams and strings; supports 'zip' and 'tar' formats; can output a Buffer (default), Stream or to a path.

Can extract archives from a path, Buffer or Stream to a specified path.

## Install

npm install simple-archiver --save

## Usage

### Archive

```js
var archive = require('simple-archiver').archive;

archive(path)
  .then(archiveBuffer => console.log('Done! We should do something with the buffer.'))
  .catch(console.log);

archive(['/path/file.txt', '/path/auto-detect-dir-or-file-type', '/and-so-on']); // .then(...).catch(...);

// You can include Buffers, Streams and Strings in the archive as well (giving them a name)
archive([
 { data: '/path/file', type: 'file',      name: 'new-file-name'  },
 { data: '/path/dir',  type: 'directory', name: 'new-dir-name'  },
 { data: buffer,       type: 'buffer',    name: 'file1' },
 { data: stream,       type: 'stream',    name: 'file2' },
 { data: 'string',     type: 'string',    name: 'file3' }
], {
     format: 'tar',
     output: '/path/archive.tar'
}); // we're making it a 'tar' archive and saving it to a path
```
For optimal performance, you would use objects specifying the type and name of each entry. While not optimal, the type can be determined automatically, but the name can only be determined for paths (files and directories).

### Extract

```js
var extract = require('simple-archiver').extract;

// archive can be a path (String), Buffer or Stream
let archive = '/myarchive.tar';
extract(archive, '/path', { format: 'tar' }) // format is 'zip' by default, so you have to specify it for 'tar'
  .then(() => console.log('Extraction finished!'))
  .catch(console.log);
```

## Details

### archive (entries, options)
=> Promise

Resolves to an archive Buffer (default), Stream or path depending on the chosen output.

#### - entries
Array of Objects | Array of Strings | Object | String

Object properties:
- `data` - The data you wish to archive: file/directory path (String), Buffer, Stream or String (to save as a file);
- `type` - (optional) Entry type: 'file', 'directory', 'other'; The type can be automatically determined so it's optional (but if you know it, use it); Buffer, Stream and String are handled automatically and are classified here as 'other'; you can use any name instead of 'other' since it's the default;
- `name` - (optional) The name the entry will have in the archive; may be a path within the archive (e.g. '/path/name'); Optional for 'file' and 'directory' (basenames are used by default), recommended for 'other' (a counter will be used if missing, starts at 101);

#### - options
(Optional) Object

Object properties:

- `format` - (optional) Archive format: 'zip' (default), 'tar';
- `output` - (optional) Output type: 'buffer' (default), 'stream', '/path'; If you enter a path string, the archive will be saved there and the resolve value will be the path string;

### extract (archive, destination, options)
=> Promise

Extraction has finished when the promise resolves

#### - archive
String | Buffer | Stream

The archive path (String), Buffer or Stream.

#### - destination
String

The path to save the archive contents to.

#### - options
(Optional) Object

Object properties:

- `format` - (optional) Archive format: 'zip' (default), 'tar';

Note: Extract doesn't know the format of your archive, so if it's not 'zip', remember to set it.

## Extras

### [archiver](https://github.com/archiverjs/node-archiver)
Used by archive() and provided for you if you need access to advanced options.

### [unzip2](https://github.com/glebdmitriew/node-unzip-2) & [tar](https://github.com/npm/node-tar)
Used by extract() and provided as unzip and tar from the module.

## Issues & Features
If you have an issue, it's probably related to the above npm packages used in this project. Do your research before you create a new issue.

If you want to propose a new feature, check if it's possible through the above mentioned packages first. If yes, then create a new issue for it, if no, then go to the relevant package and create a new issue for it there.

## Thanks
A big thank you to the above package creators and collaborators for making this possible.
