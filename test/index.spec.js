"use strict";

// Node.js
var fs = require('fs');
var spawn = require('child_process').spawn;

// npm
var expect = require('chai').expect;
var co = require('co');

// Project
var archiver = require('..');
var archive = archiver.archive;
var extract = archiver.extract;

const SOURCE = __dirname + '/resources/source';
const DESTINATION = __dirname + '/resources/destination';

describe('Archiver', function () { // this.timeout(10000); // only without arrow functions
  let formats = [
    { type: 'tar', value: 'tar' },
    { type: 'zip', value: 'zip' },
    { type: 'zip' }  // DEFAULT
  ];

  describe('extract()', () => {
    beforeEach(() => cleanup());

    let inputs = [
      { type: 'path string', value: format => Promise.resolve(`${SOURCE}.${format}`) },
      { type: 'buffer',      value: format => promisify(fs.readFile, [`${SOURCE}.${format}`]) },
      { type: 'stream',      value: format => Promise.resolve(fs.createReadStream(`${SOURCE}.${format}`)) }
    ];

    for (let format of formats) {
      for (let input of inputs) {
        it(`should extract a ${format.type} archive from a ${input.type}`, () => co(function *() {
          yield extract(yield input.value(format.type), DESTINATION, { format: format.value });
          expect(yield same(SOURCE, DESTINATION)).to.be.true;
        }));
      }
    }
  });

  describe('archive()', () => {
    let outputs = [
      { type: 'buffer', value: 'buffer' },
      { type: 'stream', value: 'stream' },
      { type: 'path',   value: `${SOURCE}test` },
      { type: 'buffer' } // DEFAULT
    ];

    beforeEach(() => cleanup());

    let inputs = [
      { source: 'file', dest: 'file', type: 'a file',              value: () => Promise.resolve(`${SOURCE}/file`) },
      { source: 'dir',  dest: 'dir',  type: 'a directory',         value: () => Promise.resolve(`${SOURCE}/dir`) },
      { source: 'file', dest: '101',  type: 'a stream',            value: () => Promise.resolve(fs.createReadStream(`${SOURCE}/file`)) }, // by making them functions we ensure a new stream here (one stream would be depleted and cause an error next time it's used)
      { source: 'file', dest: '101',  type: 'a buffer',            value: () => promisify(fs.readFile, [`${SOURCE}/file`]) }, // by making them promises we can avoid an asynchronous mess with readFile
      { source: 'file', dest: '101',  type: 'a string',            value: () => promisify(fs.readFile, [`${SOURCE}/file`, 'utf8']) },
      { source: '',     dest: '',     type: 'an array',            value: () => Promise.resolve([`${SOURCE}/dir`, `${SOURCE}/file`, `${SOURCE}/file1.txt`, `${SOURCE}/file2`, `${SOURCE}/file3.txt`]) },
      { source: 'file', dest: 'file', type: 'an object',           value: () => Promise.resolve({ data: `${SOURCE}/file`, type: 'file', name: 'file' }) },
      { source: '',     dest: '',     type: 'an array of objects', value: () => co(function *() { return [
        { data: `${SOURCE}/file`, type: 'file', name: 'file' },
        { data: `${SOURCE}/dir`,  type: 'directory',  name: 'dir' },
        { data: fs.createReadStream(`${SOURCE}/file1.txt`), type: 'stream', name: 'file1.txt' },
        { data: yield promisify(fs.readFile, [`${SOURCE}/file2`]), type: 'buffer', name: 'file2' },
        { data: yield promisify(fs.readFile, [`${SOURCE}/file3.txt`, 'utf8']), type: 'string', name: 'file3.txt' }
      ]; }) }
    ];

    for (let format of formats) {
      for (let input of inputs) {
        for (let output of outputs) {
          it(`should archive using '${format.type}' from '${input.type}' and output a '${output.type}'`, () => co(function *() {
            let archiveData = yield archive(yield input.value(), { format: format.value, output: output.value });
            yield extract(archiveData, DESTINATION, { format: format.value });
            expect(yield same(`${SOURCE}/${input.source}`, `${DESTINATION}/${input.dest}`)).to.be.true;
          }));
        }
      }
    }
  });
});

function same (source, destination) {
  return execute('diff', ['-r', source, destination]).then(res => res === 0);
}

function cleanup () {
  let promises = [
    execute('rm', ['-rf', DESTINATION]).then(execute('mkdir', [DESTINATION])),
    execute('rm', ['-rf', `${SOURCE}test`])
  ];
  return Promise.all(promises);
}

function execute(command, args) {
  return new Promise((resolve, reject) => {
    let cmd = spawn(command, args);

    cmd.on('error', reject).on('close', resolve);
    cmd.stdout.on('data', res => resolve(res.toString()));
    cmd.stderr.on('data', err => reject(new Error(err.toString())));
  });
}

function promisify (fun, args) {
  return new Promise ((resolve, reject) => {
    // push a callback function to handle err and res
    args.push((err, res) => err ? reject(err) : resolve(res));
    fun.apply(this, args);
  });
}
