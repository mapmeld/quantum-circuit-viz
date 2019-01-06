
const Layer = function (qubits, registers) {
  this.qubits = [].concat(qubits);
  this.registers = [].concat(registers);
};
Layer.prototype = {
  set_qubit: function (qubit, element) {
    this.qubits[this.qubits.indexOf(qubit)] = element;
  },

  set_qu_multibox: function (bits, label, connectors) {
    connectors = connectors || {};
    let top_connect = connectors.top_connect || null;
    let bit_index = bits.map((bit) => {
      return this.qubits.indexOf(bit);
    }).sort();

    for (let e = 1; e < bit_index.length; e++) {
      if (bit_index[e] !== bit_index[e - 1] + 1) {
        throw new Error('Visualizer cannot handle operation on non-neighboring qubits');
      }
    }

    if (bits.length === 1) {
      this.set_qubit(bits[0], elements.BoxOnQuWire(label, { top_connect: top_connect }));
    } else {
      this.set_qubit(bits[0], elements.BoxOnQuWireTop(label, { top_connect: top_connect }));
      // bits.forEach((bit, bindex) => {
      //   this.set_qubit(bit, elements.BoxOnQuWireMid(label, bits.length, order));
      // });
      this.set_qubit(bits[bits.length - 1], elements.BoxOnQuWireBot(label, bits.length));
    }
  },

  set_clbit: function (bit, element) {
    this.registers[this.registers.indexOf(bit)] = element;
  },

  set_cl_multibox: function () {

  },

  connect_with: function () {

  },

  full_layer: function () {
    return [].concat(this.qubits).concat(this.registers);
  }
};

function merge_lines(top, bot, icod) {
  if (!icod) {
    icod = 'top';
  } else {
    icod = icod.icod;
  }

  let ret = "";

  if (bot.length === 1) {
    while (bot.length < top.length) {
      bot += bot[0];
    }
  } else if (top.length === 1) {
    while (top.length < bot.length) {
      top += top[0];
    }
  } else {
    while(bot.length < top.length) {
      bot = bot + ' ';
    }
  }

  function zip(arrays) {
    return arrays[0].map(function(_,i){
        return arrays.map(function(array){return array[i]})
    });
  }

  zip([top.split(""), bot.split("")]).forEach((compare) => {
    let topc = compare[0],
        botc = compare[1];

    if (topc === botc) {
      ret += topc;
    } else if ('┼╪'.indexOf(topc) > -1 && botc === " ") {
      ret += "│";
    } else if (topc === " ") {
      ret += botc;
    } else if ('┬╥'.indexOf(topc) > -1 && " ║│".indexOf(botc) > -1) {
      ret += topc;
    } else if ('┬│'.indexOf(topc) > -1 && botc === "═") {
      ret += '╪';
    } else if ('┬│'.indexOf(topc) > -1 && botc === "─") {
      ret += '┼';
    } else if ('└┘║│░'.indexOf(topc) > -1 && botc === " ") {
      ret += topc;
    } else if ('─═'.indexOf(topc) > -1 && botc === " " && icod === "top") {
      ret += topc;
    } else if ('─═'.indexOf(topc) > -1 && botc === " " && icod === "bot") {
      ret += botc;
    } else if ("║╥".indexOf(topc) > -1 && "═".indexOf(botc) > -1) {
      ret += "╬";
    } else if ("║╥".indexOf(topc) > -1 && "─".indexOf(botc) > -1) {
      ret += "╫";
    } else if ('╫╬'.indexOf(topc) > -1 && " ".indexOf(botc) > -1) {
      ret += "║";
    } else if ('└'.indexOf(topc) > -1 && botc === "┌") {
      ret += "├";
    } else if ('┘'.indexOf(topc) > -1 && botc === "┐") {
      ret += "┤";
    } else {
      ret += botc;
    }
  });
  return ret;
}

function draw_wires (wires) {
  let lines = [],
      bot_line = null,
      top_line = null,
      mid_line = null;

  wires.forEach((wire, index) => {
    top_line = ""
    wire.forEach((instruction) => {
      top_line += instruction.top;
    });

    if (!bot_line) {
      lines.push(top_line);
    } else {
      lines.push(merge_lines(lines.pop(), top_line));
    }

    // MID
    mid_line = ""
    wire.forEach((instruction) => {
      mid_line += instruction.mid;
    });

    lines.push(merge_lines(lines[lines.length - 1], mid_line, { icod: "bot" }));

    // BOT
    bot_line = ""
    wire.forEach((instruction) => {
      bot_line += instruction.bot;
    });

    lines.push(merge_lines(lines[lines.length - 1], bot_line, { icod: "bot" }));
  });
  return lines;
}

function label_for_box (instruction) {
  if (instruction.angle) {
    let radians = Math.PI;
    if (instruction.angle.action === 'divide') {
      radians /= instruction.angle.number;
    } else {
      radians *= instruction.angle.number;
    }
    return instruction.name + '(' + radians.toFixed(4) + ')';
  } else {
    return instruction.name;
  }
}

function break_fillup_layer(layer_length, arrow_char) {
  let breakwire_layer = []
  while (layer_length > 0) {
    breakwire_layer.push(elements.BreakWire(arrow_char));
    layer_length--;
  }
  return breakwire_layer;
}

function empty_fillup_layer(layer, noqubits) {
  return layer.map((instruction, index) => {
    if (!instruction || (typeof instruction === 'number')) {
      if (index >= noqubits) {
        return elements.EmptyWire('═════');
      } else {
        return elements.EmptyWire('─────');
      }
    } else {
      return instruction;
    }
  });
}

function input_fillup_layer(names) {
  let longest = 0,
      input_wires = [];
  names.forEach((name) => {
    longest = Math.max(longest, name.length);
  });
  names.forEach((name) => {
    let longname = name;
    while (longname.length < longest) {
      longname = ' ' + longname;
    }
    input_wires.push(elements.InputWire(longname));
  });
  return input_wires;
}

function wire_names(with_initial_value, qubits, cbits) {
  let qubit_labels = [],
      cbit_labels = [];

  if (with_initial_value) {
    qubit_labels = qubits.map(q => 'q_' + q + ': |0>');
    cbit_labels = cbits.map(c => 'c_' + c + ': 0 ');
  } else {
    qubit_labels = qubits.map(q => q + ': ');
    cbit_labels = cbits.map(c => c + ': ');
  }

  return qubit_labels.concat(cbit_labels);
}

const textViz = (circuit) => {

  let _width = null,
      label = null,
      mid_content = null,
      top_connect = null,
      bot_connect = " ",
      top_pad = " ",
      mid_padding = " ",
      bot_pad = " ",
      bot_connector = {},
      top_connector = {},
      right_fill = 0,
      left_fill = 0,
      plotbarriers = false,
      layers = [],
      registersUsed = circuit.registersUsed();

  if (registersUsed.length === 0) {
    registersUsed = [0];
  }

  layers.push(
    input_fillup_layer(
      wire_names(true, circuit.qubitsUsed(), registersUsed)
    )
  );

  circuit.actions.forEach((instruction) => {
    instruction.name = instruction.name || 'measure';

    console.log(instruction);

    let layer = new Layer(circuit.qubitsUsed(), circuit.registersUsed()),
        connector_label = null,
        qubitsUsed = instruction.qubitsUsed(),
        registersUsed = instruction.registersUsed();

    if (instruction.name === 'measure') {
        layer.set_qubit(qubitsUsed[0], elements.MeasureFrom());
        layer.set_clbit(registersUsed[0], elements.MeasureTo());

    } else if (['barrier', 'snapshot', 'save', 'load', 'noise'].indexOf(instruction.name) > -1) {
      if (!plotbarriers) {
        return;
      }
      qubitsUsed.forEach((qubit) => {
        layer.set_qubit(qubit, elements.Barrier());
      });

    } else if (instruction.name === 'SWAP') {
      layer.set_qubit(qubitsUsed[0], elements.Ex('│'));
      layer.set_qubit(qubitsUsed[1], elements.Ex(' '));

    } else if (instruction.name === 'Controlled SWAP') {
      layer.set_qubit(qubitsUsed[0], elements.Bullet());
      layer.set_qubit(qubitsUsed[1], elements.Ex());
      layer.set_qubit(qubitsUsed[2], elements.Ex());

    } else if (instruction.name === 'Reset') {
      layer.set_qubit(qubitsUsed[0], elements.Reset());

    } else if (instruction.condition) {
      // # conditional
      let cllabel = label_for_conditional(instruction),
          qulabel = label_for_box(instruction);

      layer.set_cl_multibox(instruction.condition[0], cllabel, { top_connect: '┴' });
      layer.set_qubit(qubitsUsed[0], elements.BoxOnQuWire(qulabel, { bot_connect: '┬' }));

    } else if (['Controlled X', 'ccx'].indexOf(instruction.name) > -1) {
      qubitsUsed.forEach((qubit) => {
        layer.set_qubit(qubit, elements.Bullet());
      });
      layer.set_qubit(qubitsUsed[qubitsUsed.length - 1], elements.BoxOnQuWire('X'));

    } else if (instruction.name === 'Controlled Y') {
      layer.set_qubit(qubitsUsed[0], elements.Bullet());
      layer.set_qubit(qubitsUsed[1], elements.BoxOnQuWire('Y', { top_connector: '┴' }));

    } else if (instruction.name === 'Controlled Z') {
      layer.set_qubit(qubitsUsed[0], elements.Bullet());
      layer.set_qubit(qubitsUsed[1], elements.BoxOnQuWire('Z'));

    } else if (instruction.name === 'Controlled H') {
      layer.set_qubit(qubitsUsed[0], elements.Bullet());
      layer.set_qubit(qubitsUsed[1], elements.BoxOnQuWire('H'));

    } else if (instruction.name === 'Controlled U1') {
      let connector_label = params_for_label(instruction)[0];
      layer.set_qubit(qubitsUsed[0], elements.Bullet());
      layer.set_qubit(qubitsUsed[1], elements.BoxOnQuWire('U1'));

    } else if (instruction.name === 'Controlled U3') {
      let params = params_for_label(instruction);
      layer.set_qubit(qubitsUsed[0], elements.Bullet())
      layer.set_qubit(qubitsUsed[1], elements.BoxOnQuWire("U3(" + params.join(',') + ')'))

    } else if (instruction.name === 'Controlled Rz') {
      let params = params_for_label(instruction)[0],
          label = "Rz(" + params + ")";
      layer.set_qubit(qubitsUsed[0], elements.Bullet());
      layer.set_qubit(qubitsUsed[1], elements.BoxOnQuWire(label));

    } else if (qubitsUsed.length === 1 && instruction.registersUsed().length === 0) {
      layer.set_qubit(qubitsUsed[0], elements.BoxOnQuWire(label_for_box(instruction)));

    } else if (qubitsUsed.length >= 2 && instruction.registersUsed().length === 0) {
      layer.set_qu_multibox(qubitsUsed, label_for_box(instruction));

    } else {
        throw new Error("Text visualizer does not know how to handle this instruction: " + instruction.name);
    }

    layer.connect_with("│", connector_label);

    layers.push(layer.full_layer());

  });

  let line_length = 1000,
      layer_groups = [[]],
      rest_of_the_line = line_length,
      noqubits = circuit.qubitsUsed().length,
      allLength = 0;

  /* help make empty wires come in */
  layers.forEach((layer) => {
    allLength = Math.max(allLength, layer.length);
  });
  layers.forEach((layer) => {
    while(layer.length < allLength) {
      layer.push(null);
    }
  });

  layers.forEach((layer, layerno) => {
    // Replace the Nones with EmptyWire
    layer = empty_fillup_layer(layer, noqubits);
    layers[layerno] = layer;
    // normalize_width(layer);

    if (line_length == -1) {
      // Do not use pagination (aka line breaking. aka ignore line_length).
      layer_groups[layer_groups.length - 1].push(layer);
      return;
    }

    // chop the layer to the line_length (pager)
    let layer_length = layers[layerno][0].toString().length;

    if (layer_length < rest_of_the_line) {
      layer_groups[layer_groups.length - 1].push(layer);
      rest_of_the_line -= layer_length;
    } else {
      layer_groups[layer_groups.length - 1].push(break_fillup_layer(layer.length, '»'));

      // New group
      layer_groups.push([break_fillup_layer(layer.length, '«')]);
      let subtraction = layer_groups[layer_groups.length - 1];
      subtraction = subtraction[subtraction.length - 1][0].length;
      rest_of_the_line = line_length - subtraction;

      layer_groups[layer_groups.length - 1].push(
            input_fillup_layer(
              wire_names(false, circuit.qubitsUsed(), circuit.registersUsed())
            ));
      let sub2 = layer_groups[layer_groups.length - 1];
      sub2 = sub2[sub2.length - 1][0].length;
      rest_of_the_line -= sub2;

      layer_groups[layer_groups.length - 1].push(layer)
      let sub3 = layer_groups[layer_groups.length - 1];
      sub3 = sub3[sub3.length - 1][0].length;
      rest_of_the_line -= sub3;
    }
  });

  let lines = [];

  layer_groups.forEach((layer_group) => {
    let wires = [];

    layer_group.forEach((layer, layerOrder) => {
      layer.forEach((block, blockOrder) => {
        if (!wires[blockOrder]) {
          wires.push([]);
        }
        wires[blockOrder].push(block);
      });
    });

    lines = lines.concat(draw_wires(wires));
  });

  return lines.join("\n");
};

const elements = {
  MeasureTo: () => {
    return {
      toString: () => {
        return [" ║ ",
                "═╩═",
                "   "];
      },
      top: ' ║ ',
      mid: '═╩═',
      bot: '   '
    };
  },

  MeasureFrom: () => {
    return {
      toString: () => {
        return ['┌─┐',
                "┤M├",
                "└╥┘"];
      },
      top: '┌─┐',
      mid: '┤M├',
      bot: '└╥┘'
    };
  },

  BoxOnQuWire: (qb, connectors) => {
    return {
      toString: () => {
        return '└───┘';
      },
      top: ((connectors && connectors.top_connector) ? ('┌─' + connectors.top_connector + '─┐') : ('┌─' + qb.split('').map(d => '─').join('') + '─┐')),
      mid: '┤ ' + qb + ' ├',
      bot: '└─' + qb.split('').map(d => '─').join('') + '─┘'
    };
  },

  BoxOnQuWireTop: (qb) => {
    return {
      toString: () => {
        return '└───┘';
      },
      top: '───',
      mid: '',
      bot: '│ ' + qb + ' │',
    };
  },

  BoxOnQuWireMid: (qb) => {
    return {
      toString: () => {
        return '└───┘';
      },
      top: '│ ' + qb + ' │',
      mid: '',
      bot: '│ ' + qb + ' │'
    };
  },

  BoxOnQuWireBot: (qb) => {
    return {
      toString: () => {
        return '└───┘';
      },
      top: '│ ' + qb + ' │',
      mid: '',
      bot: '───'
    };
  },

  Bullet: () => {
    return {
      toString: () => {
        return '■';
      },
      top: '     ',
      mid: '──■──',
      bot: '     '
    };
  },

  Ex: (bot_connect) => {
    return {
      toString: () => {
        return '─X─';
      },
      top: '     ',
      mid: '──X──',
      bot: '  ' + bot_connect + '  '
    }
  },

  InputWire: (longname) => {
    return {
      toString: () => {
        return 'input';
      },
      top: longname.split('').map(c => ' ').join(''),
      mid: longname,
      bot: longname.split('').map(c => ' ').join('')
    };
  },

  EmptyWire: (wire) => {
    return {
      toString: () => {
        return 'empty';
      },
      top: wire.split('').map(c => ' ').join(''),
      mid: wire,
      bot: wire.split('').map(c => ' ').join('')
    };
  },

  BreakWire: (arrow_char) => {
    return {
      toString: () => {
        return arrow_char;
      },
      top: ' ',
      mid: arrow_char,
      bot: ' '
    };
  }
};

export { elements, textViz };
