var Command = require('mkcli-runtime/lib/command')
  , Option = require('mkcli-runtime/lib/option')
  , Flag = require('mkcli-runtime/lib/flag');

var re = new RegExp(
  // optional leading key specification
  '^([\\w_\.]+:\\s*)?'
  // list of command/option names
  + '((?:-{0,2}[\\w\\[\\]|]+(?:,\\s*)?)+)'
  // option value
  + '((?:=|\\s+)[\\[<][^\\]>]+[\\]>])?'
  // optional type and default value specification
  + '(?:\\s*\\{([^}]+)\\})?'
  // zsh action specification
  + '(?:\\s*(:.+))?'
);

/**
 *  Parse a string literal to a command, flag or option.
 *
 *  @static {function} parse
 *  @param {String} input the option definition.
 *  @param {Object} [opts] parsing options.
 *
 *  @option {Boolean=false} command parse as a command.
 *  @option {Boolean=true} camelcase convert automatic keys to camelcase.
 */
function parse(input, opts) {
  opts = opts || {};

  var arg
    , res = {}
    , extra
    , pair;

  input.replace(re, function(match, key, names, value, info, zaction) {
    res.key = key;
    res.names = names;
    res.value = value;
    res.info = info;
    res.zaction = zaction;
  })

  if(!res.names) {
    throw new TypeError('command or option declaration has no names'); 
  }

  var names = res.names.split(/,\s*/)
    , keys;

  opts.camelcase = opts.camelcase !== undefined ? opts.camelcase : true;


  // work out automatic key generation from longest option name
  if(!res.key) {

    // strip leading hyphens from list of option names
    if(opts.camelcase) {
      keys = names.map(function strip(nm) {
        return nm.replace(/^-{1,2}/, ''); 
      })
    }else{
      keys = names;
    }

    // sort keys by longest to shortest on `length` property
    keys = keys.sort(function(a, b) {
      a = a.length;
      b = b.length;
      if(a === b) {
        return 0; 
      } 
      return a < b ? 1 : -1;
    })

    var camelcase = require('cli-argparse').camelcase;
    // do not include negation in automatic keys
    res.key = keys[0].replace(/^\[?no\]?-/,'');
    res.key = opts.camelcase ? camelcase(res.key) : res.key;

  }else{
    res.key = res.key.replace(/:\s*$/, '');
  }

  // no value specification so create a flag option
  if(opts.command) {
    arg = new Command(); 
  }else if(!res.value) {
    arg = new Flag(); 
  }else{
    extra = res.value.trim();
    arg = new Option();
    arg.extra = res.value;
    arg.multiple = Boolean(~extra.indexOf('...'));
    arg.required = Boolean(~extra.indexOf('<') && ~extra.indexOf('>'))

    if(res.info) {
      // just the type info
      if(!~res.info.indexOf('=')) {
        arg.kind = res.info; 
      }else{
        pair = res.info.split('=');

        // set kind of option value
        if(pair[0]) {
          arg.kind = pair[0];
        }

        // set default value for option, may be the empty string
        arg.value = pair[1];
      }


      if(arg.kind) {
        // support enum style multiple type declarations
        if(~arg.kind.indexOf('|')) {
          arg.kind = arg.kind.split('|'); 
        }
      }
    }
  }

  arg.literal = input;
  arg.key = res.key;
  arg.names = names;
  if(res.zaction) {
    arg.zaction = res.zaction;
  }

  // choose longest name
  var sorted = names.slice(0).sort(function(a, b) {
    a = a.length;
    b = b.length;
    if(a === b) {return 0;}
    return a < b ? 1 : -1;
  })
  arg.name = sorted[0];

  return arg;
}

module.exports = parse;
