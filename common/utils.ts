import { styleText } from 'node:util';

function printTextWithHeading(...entries:any[]) {
    console.log( styleText(['green', 'bold'], entries.shift()), ...entries );
}

export { printTextWithHeading };
