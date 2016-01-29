var x = new TVar(5)

function TVar (val) {
  var self = this
  this.val = val
  this.pending = []

  this.readTVar = function() {
    return self.val
  }
  this.writeTVar = function(newVal) {
    self.val = newVal
  }

  this.registerPending = function(cb) {
    self.pending.push(cb)
  }

  this.lock = function() {self.blocked = true}
  this.unlock = function() {
    self.blocked = false
    checkPending()
  }

  checkPending = function() {
    if (self.pending.length != 0) {
      self.pending.shift()()
    }
  }

}

function atomically(tvar, proc, cb) {
  if(tvar.blocked) {
    console.log("read attempted by " + proc + ", locking")
    tvar.registerPending(function () {atomically(tvar, proc, cb)})
  } else {
    console.log(proc + ' locked Mvar')
    tvar.lock()
    cb(tvar, tvar.unlock)
  }

}



process.nextTick(function() {
  atomically(x, 'a', function(x, done) {
    var y = x.readTVar()
    setTimeout(function() {
      x.writeTVar(y+1)
      console.log('Process a increased, x = ', x.readTVar())

      done()
    }, 2000)
  })
})

process.nextTick(function() {
  atomically(x, 'b', function(x, done) {
    var y = x.readTVar()
    x.writeTVar(y+1)
    console.log('Process b increased, x = ', x.readTVar())
    done()
  })
})
