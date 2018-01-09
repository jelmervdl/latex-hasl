#!/usr/bin/env node

/*
a = Socrates is mortal
b = assume He is a man
c = All men are mortal
x = assume b supports a
y = c supports x
*/

const fs = require('fs');
const readline = require('readline');
const Canvas = require('canvas');
const {Graph} = require('./graph.js');

// These add methods to prototypes. Quite ugly in this modular design...
require('./array.js');
require('./layout.js')(Graph);
require('./canvas.js')(Canvas.Context2d);

console.log = function() {
    // noop
};

Graph.prototype.parse = function (input)
{
    if (!this.variables)
        this.variables = {};

    let lines = input.split(/\r?\n/);

    let rules = [
        {
            pattern: /^\s*([a-z0-9]+)\s*:\s*(?:(assume)\s+)?((?:[a-z0-9]+\s+)+)(?:(support|attack)s)\s+([a-z0-9]+)\s+because\s+(?:(assume)\s+)?(.+?)\s*$/,
            processor: match => {
                let sources = match[3].split(/\s+/).filter(name => name != '').map(name => {
                    if (!(name in this.variables))
                        throw new Error('Variable "' + name + '" is unknown');
                    return this.variables[name];
                });
                let target = this.variables[match[5]];
                let relation = this.addRelation(sources, target, match[4], {variable: match[1], assumption: match[2] == 'assume'});

                let major = this.addClaim(match[7], {variable: match[1], assumption: match[6] == 'assume'});
                this.addRelation([major], relation, 'major', {assumption: match[6] == 'assume'});

                this.variables[match[1]] = major;
            }
        },
        {
            pattern: /^\s*([a-z0-9]+)\s*:\s*(?:(assume)\s+)?((?:[a-z0-9]+\s+)+)(?:(support|attack|warrant|undercut)s)\s+([a-z0-9]+)$/,
            processor: match => {
                let sources = match[3].split(/\s+/).filter(name => name != '').map(name => {
                    if (!(name in this.variables))
                        throw new Error('Variable "' + name + '" is unknown');
                    return this.variables[name];
                });
                let target = this.variables[match[5]];
                let relation = this.addRelation(sources, target, match[4], {variable: match[1], assumption: match[2] == 'assume'});
                this.variables[match[1]] = relation;
            }
        },
        {
            pattern: /^\s*([a-z0-9]+)\s*:\s*(?:(assume)\s+)?(.+?)\s*$/,
            processor: match => {
                this.variables[match[1]] = this.addClaim(match[3], {variable: match[1], assumption: match[2] == 'assume'});
            }
        }
    ];

    lines.forEach((line, index) => {
        for (const rule of rules) {
            try {
                let match = line.match(rule.pattern);
                if (match) {
                    rule.processor(match, line);
                    break;
                }
            } catch (e) {
                throw new Error('Parse error on line ' + (index + 1) + ': ' + e.message);
            }
        }
    });
}

function main(input, output) {
    let canvas = new Canvas(200, 200, 'pdf');

    let graph = new Graph(canvas);

    const rl = readline.createInterface({
      input: input
    });

    rl.on('line', input => {
        graph.parse(input.replace(/##/, '#'));
    });

    rl.on('close', () => {
        graph.layout().apply();
        graph.fit();
        graph.draw();

        // console.log(graph.relations);
    });

    graph.on('draw', () => {
        fs.writeFileSync(output, canvas.toBuffer());
    });
};

function usage(name) {
    console.log('Usage: haslgraph [-o <output>] <file>');
    process.exit(0);
}

let output = 'out.pdf';

let input = process.stdin;

for (var i = 2; i < process.argv.length; ++i) {
    switch (process.argv[i]) {
        case '-o':
        case '--output':
            if (process.argv.length > i + 1)
                output = process.argv[++i];
            else
                throw new Error('Missing output filename after ' + process.argv[i] + ' option');
            break;

        case '-Tpdf':
            break;

        case '-h':
        case '--help':
            usage(process.argv[0]);
            break;

        case '--':
            input = process.stdin;
            break;

        default:
            input = fs.createReadStream(process.argv[i], 'utf8');
            break;
    }
}

main(input, output);
