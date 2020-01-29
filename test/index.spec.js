"use strict";

const fs = require('fs');
const shell = require('shelljs');
const dircompare = require('dir-compare');

const expect = require('chai').expect;

const archiver = require('..');
const archive = archiver.archive;
const extract = archiver.extract;

const SOURCE = __dirname + '/resources/source';
const DESTINATION = __dirname + '/resources/destination';

describe('Archiver', function () {
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
                it(`should extract a ${format.type} archive from a ${input.type}`, async function () {
                    await extract(await input.value(format.type), DESTINATION, { format: format.value });
                    expect(await same(SOURCE, DESTINATION)).to.be.true;
                });
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
            { source: 'file', dest: 'file', type: 'a file', value: () => Promise.resolve(`${SOURCE}/file`) },
            { source: 'dir',  dest: 'dir',  type: 'a directory', value: () => Promise.resolve(`${SOURCE}/dir`) },
            { source: 'file', dest: '0',    type: 'a stream', value: () => Promise.resolve(fs.createReadStream(`${SOURCE}/file`)), isFile: true }, // by making them functions we ensure a new stream here (one stream would be depleted and cause an error next time it's used)
            { source: 'file', dest: '0',    type: 'a buffer', value: () => promisify(fs.readFile, [`${SOURCE}/file`]), isFile: true }, // by making them promises we can avoid an asynchronous mess with readFile
            { source: 'file', dest: '0',    type: 'a string', value: () => promisify(fs.readFile, [`${SOURCE}/file`, 'utf8']), isFile: true },
            { source: '',     dest: '',     type: 'an array', value: () => Promise.resolve([`${SOURCE}/dir`, `${SOURCE}/file`, `${SOURCE}/file1.txt`, `${SOURCE}/file2`, `${SOURCE}/file3.txt`]) },
            { source: 'file', dest: 'file', type: 'an object', value: () => Promise.resolve({ data: `${SOURCE}/file`, type: 'file', name: 'file' }) },
            { source: '',     dest: '',     type: 'an array of objects', value: async function () { return [
                { data: `${SOURCE}/file`, type: 'file', name: 'file' },
                { data: `${SOURCE}/dir`,  type: 'directory',  name: 'dir' },
                { data: fs.createReadStream(`${SOURCE}/file1.txt`), type: 'stream', name: 'file1.txt' },
                { data: await promisify(fs.readFile, [`${SOURCE}/file2`]), type: 'buffer', name: 'file2' },
                { data: await promisify(fs.readFile, [`${SOURCE}/file3.txt`, 'utf8']), type: 'string', name: 'file3.txt' }
            ]; } }
        ];

        for (let format of formats) {
            for (let input of inputs) {
                for (let output of outputs) {
                    it(`should archive using '${format.type}' from '${input.type}' and output a '${output.type}'`, async function () {
                        let archiveData = await archive(await input.value(), { format: format.value, output: output.value });
                        await extract(archiveData, DESTINATION, { format: format.value });
                        expect(
                            await same(`${SOURCE}/${input.source}`, `${DESTINATION}/${input.dest}`, input.isFile),
                            `\nThe contents of:\n${SOURCE}/${input.source}\ndid not match the contents of:\n${DESTINATION}/${input.dest}\n`
                        ).to.be.true;
                    });
                }
            }
        }
    });
});

function cleanup () {
    shell.rm('-rf', DESTINATION);
    shell.mkdir(DESTINATION);
    shell.rm('-rf', `${SOURCE}test`);
}

async function same (source, destination, isFile) {
    if (isFile) {
        return (await promisify(fs.readFile, [source, 'utf8'])) === (await promisify(fs.readFile, [destination, 'utf8']))
    }

    return dircompare.compare(source, destination).then(res => res.same);
}

function promisify (fun, args) {
    return new Promise ((resolve, reject) => {
        // push a callback function to handle err and res
        args.push((err, res) => err ? reject(err) : resolve(res));
        fun.apply(this, args);
    });
}
