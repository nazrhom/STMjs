module.exports = TLog

_ = require('lodash')

function TLog() {
  var self = this
  this.log = []

  this.insert = function (el) {self.log.push(el)}
  this.commit = function (tvars) {
    tmptvars = tvars
    console.log('trying to commit the following log:')
    printLog()
    var entry = self.log.shift()
    while (entry !== undefined) {
      var tmptvar = _.find(tmptvars, entry.ref)

      if (entry.action === 'read') {
        if (entry.payload.val != tmptvar.val) return false
      }

      if (entry.action === 'write') {
        var pl = entry.payload
        if (pl.oldVal !== tmptvar.val) return false
        else tmptvar.val = pl.newVal
      }
      entry = self.log.shift()
    }
    _.forEach(tvars, function(tvar, i) {
      tvar.writeTVar(tmptvars[i].val)
    })
    return true

  }

  function printLog() {
    console.log('--- LOG ---')
    _.forEach(self.log, function (entry) {
      console.log('  ACTION:', entry.action)
      console.log('  PAYLOAD:', entry.payload)
    })
  }
}
