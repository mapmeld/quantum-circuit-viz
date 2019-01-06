import { assert } from 'chai';
import { Gates, Program } from 'quantum-quail';
import { textViz } from '../index.js';

describe('circuits', () => {
  it('draws a simple circuit', () => {
    let program = new Program();
    program.add(Gates.X(0));

    let output = textViz(program);
    assert.equal(output,['        ┌───┐',
                         'q_0: |0>┤ X ├',
                         '        └───┘',
                         ' c_0: 0 ═════',
                         '             '].join('\n'));
  });


  it('measures 3 qubits', () => {
    let expected = ["        ┌─┐          ",
                    "q_0: |0>┤M├──────────",
                    "        └╥┘  ┌─┐     ",
                    "q_1: |0>─╫───┤M├─────",
                    "         ║   └╥┘  ┌─┐",
                    "q_2: |0>─╫────╫───┤M├",
                    "         ║    ║   └╥┘",
                    " c_0: 0 ═╩════╬════╬═",
                    "              ║    ║ ",
                    " c_1: 0 ══════╩════╬═",
                    "                   ║ ",
                    " c_2: 0 ═══════════╩═",
                    "                     "].join("\n");
    let p = new Program();
    p.measure(0, 0);
    p.measure(1, 1);
    p.measure(2, 2);
    assert.equal(textViz(p), expected);
  });

  it('measures result of a Qubit thing', () => {
    let expected = ["        ┌───┐┌─┐",
                    "q_1: |0>┤ X ├┤M├",
                    "        └───┘└╥┘",
                    " c_2: 0 ══════╩═",
                    "                "].join("\n");
    let p = new Program();
    p.add(Gates.X(1));
    p.measure(1, 2);
    assert.equal(textViz(p), expected);
  });
});
