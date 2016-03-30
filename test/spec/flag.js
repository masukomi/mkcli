var expect = require('chai').expect
  , fs = require('fs')
  , ast = require('mkast')
  , mkcli = require('../../index');

describe('mkcli:', function() {
  
  it('should parse flag option', function(done) {
    var source = 'test/fixtures/flag.md'
      , target = 'target/flag.json.log'
      , data = ast.parse('' + fs.readFileSync(source))

    // mock file for correct relative path
    // mkcat normally injects this info
    data.file = source;

    var input = ast.serialize(data)
      , output = fs.createWriteStream(target)
      , opts = {
          input: input,
          output: output
        };
    
    mkcli(opts);

    output.once('finish', function() {
      var result = JSON.parse('' + fs.readFileSync(target))
        , opts = result.options;

      expect(opts.help).to.be.an('object');
      expect(opts.help.key).to.eql('help');
      expect(opts.help.names).to.eql(['-h', '--help']);

      done();
    })
  });

});
