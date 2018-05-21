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
const {Graph, Bounds} = require('./graph.js');

// These add methods to prototypes. Quite ugly in this modular design...
require('./array.js');
require('./layout.js')(Graph);
require('./canvas.js')(Canvas.Context2d);

function main(input, output, format) {
    const canvas = new Canvas(200, 200, format);

    const ctx = canvas.getContext('2d');
    ctx.textDrawingMode = 'glyph';
    
    const graph = new Graph(canvas, ctx);

    const rl = readline.createInterface({
      input: input
    });

    const lines = [];

    rl.on('line', input => {
        lines.push(input.replace(/##/g, '#'));
    });

    rl.on('close', () => {
        graph.parse(lines);
        if (graph.claims.every(claim => claim.x === 0 && claim.y === 0))
            graph.layout().apply();
        else {
            graph.updateClaimSizes();
            graph.claims.filter(claim => claim.data.compound).forEach(claim => {
                const bounds = graph.findRelations({target: claim})
                    .map(relation => relation.claim)
                    .reduce((bounds, claim) => bounds.including(claim), new Bounds());
                claim.setPosition(bounds.center.x, bounds.y - 40);
            });
        }
        graph.fit();
        graph.draw();
    });

    graph.on('draw', () => {
        fs.writeFileSync(output, canvas.toBuffer());
    });
};

function exception(e, output, format) {
    const canvas = new Canvas(600, 200, format);
    const ctx = canvas.getContext('2d');
    
    ctx.textDrawingMode = 'glyph';
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#f00';
    
    ctx.fillText(e.toString(), 0, 0);
    ctx.fillText(e.stack, 0, 20);
    
    fs.writeFileSync(output, canvas.toBuffer());
}

function usage(name) {
    console.log('Usage: haslgraph [-o <output>] <file>');
    process.exit(0);
}

let output = 'out.{}';

let format = 'pdf';

let input = process.stdin;

let exceptionAsOutput = false;

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
            format = 'pdf';
            break;

        case '-Tsvg':
            format = 'svg';
            break;

        case '-h':
        case '--help':
            usage(process.argv[0]);
            break;

        case '--output-on-error':
            exceptionAsOutput = true;
            break;

        case '--':
            input = process.stdin;
            break;

        default:
            if (/^\-/.test(process.argv[i]))
                throw new Error('Unknown argument ' + process.argv[i]);
            else
                input = fs.createReadStream(process.argv[i], 'utf8');
            break;
    }
}
try {
    main(input, output.replace(/\{\}/, format), format);
} catch (e) {
    if (exceptionAsOutput)
        exception(e, output, format);
    
    throw e;
}
