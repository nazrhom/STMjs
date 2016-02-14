
var _ = require('lodash')
var TLog = require('./TLog.js')
var TVar = require('./TVar.js').TVar
var MockTVar = require('./TVar').MockTVar

function atomically(tvars, proc, cb) {

  if (!_.isArray(tvars)) tvars = [tvars]
  var tlog = new TLog()
  var mockTVars = _.map(tvars, function (tvar) {
    var mockTVar = new MockTVar(tvar)

    mockTVar.on('writeTVar', function(upt) {
      tlog.insert({ref: tvar, action: 'write', payload: upt});
    })
    mockTVar.on('readTVar', function(upt) {
      tlog.insert({ref: tvar, action: 'read', payload: upt})
    })

    return mockTVar
  })


  function retry (alt) {
    if (_.isUndefined(alt)) return atomically(tvars, proc, cb)
    else return atomically(tvars, proc, alt)
  }

  function done (alt) {
    if(!tlog.commit(tvars)) {
      console.log('process ' + proc + ' failed to commit, retrying')
      if (_.isUndefined(alt)) return atomically(tvars, proc, cb)
      else return atomically(tvars, proc, alt)
    } else {
      console.log('process', proc, 'commited successfully')
    }
  }

  if (mockTVars.length === 1) mockTVars = mockTVars.shift()

  cb(mockTVars, retry, done)
}

function orElse(fst, snd) {
  return function(tvars, retry, done) {
      var fstRetry = retry.bind(this, snd)
      fst(tvars, fstRetry, done.bind(this, fstRetry))
  }
}
// test

var x = new TVar(5)
var y = new TVar(2)

process.nextTick(function() {
  atomically(x, 'a',
    orElse (
      function(x, retry, done) {
        // var x = tvars[0]
        // var y = tvars[1]
        a = x.readTVar()

        setTimeout(function() {
          x.writeTVar(a+1)
          console.log('Process a increased, x = ', x.readTVar())
          done()
        }, 2000)
    }, function(x, retry, done) {
        console.log('In else!!')
        var a = x.readTVar()
        x.writeTVar(a+2)
        console.log('Process a in else branch increased, x = ', x.readTVar())
        done()
    })
  )
})

process.nextTick(function() {
  atomically(x, 'b', function(x, retry, done) {
    var a = x.readTVar()
    x.writeTVar(a+1)
    console.log('Process b increased, x = ', x.readTVar())
    done()
  })
})
