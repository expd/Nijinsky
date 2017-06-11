var Redis = require('ioredis'),
  should = require('should'),
  RedisSparseBitmap = require('../index'),
  _ = require('underscore')

describe('nijinsky', function() {

  var redis

  function getCurrentMemoryBytes(callback) {
    redis.info('memory', function(err, memory) {
      if (err) callback(err)

      callback(null, parseInt(memory.split('\n')[1].split(':')[1]))

    })
  }

  before(function() {
    redis = new Redis()
  })

  beforeEach(function(done) {
    redis.flushdb(done)
  })

  it('should take less space then regular bitmap', function(done) {
    var redis_sb = new RedisSparseBitmap()

    getCurrentMemoryBytes(function(err, memory) {
      if (err) done(err)

      var initial_memory = memory

      var max_offset = 4294967296

      ids = _.times(10, function() {
        return _.random(max_offset)
      })

      var p = redis.pipeline()

      _.each(ids, function(id) {
        p.setbit('event0', id, 1)
      })

      p.exec(function(err) {
        if (err) done(err)

        getCurrentMemoryBytes(function(err, memory) {
          if (err) done(err)
          var bitmap_memory = memory - initial_memory;

          redis_sb.setbit('event1', ids, 1, function(err) {
            if (err) done(err)

            getCurrentMemoryBytes(function(err, memory) {
              if (err) done(err)
              var sparse_bitmap_memory = memory - bitmap_memory;

              sparse_bitmap_memory.should.be.lessThan(bitmap_memory / 100)
              done()
            })
          })
        })
      })
    })
  })
})
