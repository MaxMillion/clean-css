var vows = require('vows');
var assert = require('assert');

var optimize = require('../../lib/properties/optimizer');

var Tokenizer = require('../../lib/selectors/tokenizer');
var SourceTracker = require('../../lib/utils/source-tracker');
var SourceReader = require('../../lib/utils/source-reader');
var InputSourceMapTracker = require('../../lib/utils/input-source-map-tracker');

var Compatibility = require('../../lib/utils/compatibility');
var Validator = require('../../lib/properties/validator');
var addOptimizationMetadata = require('../../lib/selectors/optimization-metadata');

function _optimize(source) {
  var inputSourceMapTracker = new InputSourceMapTracker({
    options: { inliner: {} },
    errors: {},
    sourceTracker: new SourceTracker()
  });
  var tokens = new Tokenizer({
    options: {},
    inputSourceMapTracker: inputSourceMapTracker,
    sourceReader: new SourceReader(),
    sourceTracker: new SourceTracker(),
    warnings: []
  }, true).toTokens(source);

  var compatibility = new Compatibility().toOptions();
  var validator = new Validator(compatibility);
  var options = {
    aggressiveMerging: true,
    compatibility: compatibility,
    sourceMap: true,
    shorthandCompacting: true
  };
  addOptimizationMetadata(tokens);
  optimize(tokens[0][1], tokens[0][2], false, true, options, validator);

  return tokens[0][2];
}

vows.describe(optimize)
  .addBatch({
    'with source map': {
      topic: 'a{margin-top:10px;margin-bottom:4px;margin-left:5px;margin-right:5px}',
      'into': function(topic) {
        assert.deepEqual(_optimize(topic), [
          [
            ['margin', false, false, [[1, 2, undefined], [1, 18, undefined], [1, 36, undefined], [1, 52, undefined]]],
            [ '10px', [[1, 13, undefined]]],
            [ '5px', [[1, 65, undefined]]],
            [ '4px', [[1, 32, undefined]]]
          ]
        ]);
      }
    }
  })
  .export(module);
