var Redis = require('ioredis'),
  should = require('should'),
  RedisSparseBitmap = require('../index'),
  _ = require('underscore'),
  async = require('async')

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

  it('should count set bits', function(done) {
    var redis_sb = new RedisSparseBitmap()

    var max_offset = 100000

    var count = _.random(100)

    var ids = _.times(count, function() {
      return _.random(max_offset)
    })

    redis_sb.setbit('event1', ids, 1, function(err) {
      if (err) done(err)

      redis_sb.bitcount('event1', function(err, _count) {
        if (err) done(err)

        count.should.eql(_count)
        done()
      })
    })

  })

  it('should return set bits', function(done) {
    var redis_sb = new RedisSparseBitmap()

    var max_offset = 32678 * 1024

    var count = _.random(100)

    var ids = _.times(count, function() {
      return _.random(max_offset)
    })

    redis_sb.setbit('event1', ids, 1, function(err) {
      if (err) done(err)

      redis_sb.getbits('event1', function(err, _ids) {
        if (err) done(err)

        ids.sort().should.be.eql(_ids.sort())

        ids.should.eql(_ids)
        done()
      })
    })

  })

  it.skip('should return same results for bit ops', function(done) {
    var redis_sb = new RedisSparseBitmap()

    var max_offset = 4294967296

    ids = _.times(2, function() {
      return _.times(10, function() {
        return _.random(max_offset)
      })
    })

    console.log(ids, 'ids')
    var p = redis.pipeline()

    _.each(ids, function(_ids, i) {
      var key = 'event' + i
      _.each(_ids, function(_id) {
        p.setbit(key, _id, 1)
      })
    })

    funcs = _.map(ids, function(_ids, i) {

      var key = 'sparse_event' + i
      console.log(_ids, key)
      return function(callback) {
        redis_sb.setbit(key, _ids, 1, callback)
      }
    })

    funcs.push(function(callback) {
      p.exec(callback)
    })

    console.log(funcs, 'funcs')

    var expected = _.intersection(ids[0], ids[1])

    async.parallel(funcs, function(err) {
      if (err) done(err)

      //BITOP AND destkey srckey1 srckey2
      redis_sb.bitop('AND', 'sparse_event_and', 'sparse_event0', 'sparse_event1', function(err) {
        if (err) done(err)
        redis_sb.bitcount('sparse_event_and', function(err, count) {
          if (err) done(err)
          count.should.be.eql(expected.length)
          done()
        })
      })

    })
  })
})
