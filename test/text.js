import { assert } from 'chai';
import { elements } from '../text.js';

describe('individual elements', () => {
  it('measure to', () => {
    let element = elements.MeasureTo().toString(),
        expected = [" ║ ",
                    "═╩═",
                    "   "];
    assert.deepEqual(expected, element);
  });

  it('measure from', () => {
    let element = elements.MeasureFrom().toString(),
        expected = ["┌─┐",
                    "┤M├",
                    "└╥┘"];
    assert.deepEqual(expected, element);
  });

  // TODO pager / pager-disable
});
