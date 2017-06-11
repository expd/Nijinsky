var Redis = require('ioredis'),
  _ = require('underscore')

function RedisSparseBitmap(options) {
  this.redis = new Redis(options)
  this.options = {
    chunk_size: 32678
  }
}

RedisSparseBitmap.prototype.setbit = function(key, offset, value, callback) {

  var self = this

  if (_.isArray(offset)) {

    var p = self.redis.pipeline()

    _.each(offset, function(_offset) {
      var chunk_offset = _offset % self.options.chunk_size
      var chunk_id = (_offset - chunk_offset) / self.options.chunk_size
      var sub_key = key + ':' + chunk_id

      p.setbit(sub_key, chunk_offset, value)
    })

    p.exec(callback)


  } else {
    var chunk_offset = offset % self.options.chunk_size
    var chunk_id = (offset - chunk_offset) / self.options.chunk_size
    var sub_key = key + ':' + chunk_id

    self.redis.setbit(sub_key, chunk_offset, value, callback)
  }
}


module.exports = RedisSparseBitmap
