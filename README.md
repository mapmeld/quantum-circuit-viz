# Quantum Circuit Viz (JS)

JS port of DrawElement <a href="https://github.com/Qiskit/qiskit/blob/main/qiskit/visualization/circuit/text.py">quantum-circuit-drawer</a> in QISKit-Terra

```javascript
let element = elements.MeasureFrom().toString(),
    expected = ["┌─┐",
                "┤M├",
                "└╥┘"];
assert.deepEqual(expected, element);
```

Made compatible with <a href="http://github.com/mapmeld/quantum-peep">Quantum-Peep</a>

```javascript
let program = new Program();
program.add(Gates.X(0));

let output = textViz(program);
assert.equal(output,['        ┌───┐',
                     'q_0: |0>┤ X ├',
                     '        └───┘',
                     ' c_0: 0 ═════',
                     '             '].join('\n'));
```

## License

Apache-2.0 (same as QISKit-Terra)
