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

  var index_sub_key = key + ':_'

  var p = self.redis.pipeline()

  var _setbit = function(_offset) {
    var chunk_offset = _offset % self.options.chunk_size
    var chunk_id = (_offset - chunk_offset) / self.options.chunk_size
    var sub_key = key + ':' + chunk_id

    p.setbit(sub_key, chunk_offset, value)
    p.setbit(index_sub_key, chunk_id, 1)
  }

  if (_.isArray(offset)) {
    _.each(offset, _setbit)

  } else {
    _setbit(offset)

  }

  p.exec(callback)

}


module.exports = RedisSparseBitmap
