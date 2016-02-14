module.exports = {TVar: TVar, MockTVar: MockTVar}

var callerId = require('caller-id')

var util = require('util')
var EventEmitter = require('events').EventEmitter

function TVar (val) {
  var self = this
  this.val = val

  this.readTVar = function() {
    return self.val
  }
  this.writeTVar = function(newVal) {
    self.val = newVal
  }

}

function MockTVar (tvar) {
  var self = this
  this.tvarValue = tvar.readTVar()
  EventEmitter.call(self)


  this.readTVar = function() {
    var val = self.tvarValue
    self.emit('readTVar', {val: val})
    return val
  }

  this.writeTVar = function(newVal) {
    oldVal = self.tvarValue
    self.tvarValue = newVal
    self.emit('writeTVar', {oldVal: oldVal, newVal: newVal})
  }

}

util.inherits(MockTVar, EventEmitter)
