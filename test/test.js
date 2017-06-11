var Redis = require('ioredis'),
  should = require('should'),
  RedisSparseBitmap = require('../index'), _ = require('underscore')

describe('nijinsky', function() {


  it('should create sparse sub key', function(done) {
    var redis = new Redis();
    var redis_sb = new RedisSparseBitmap()

    var chunk_size = redis_sb.options.chunk_size
    id = _.random(4294967296)

    expected_chunk_id = (id - (id % chunk_size)) /  chunk_size;

    redis_sb.setbit('event' , id , 1 , function(err){
      redis.exists('event' + ':' + expected_chunk_id , function(err,exists){
        if(err) done(err)
        exists.should.eql(1);
        done()
      })
    })
  });
})
