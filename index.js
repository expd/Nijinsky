var Redis = require('ioredis')

function RedisSparseBitmap(options) {
  this.redis = new Redis(options)
  this.options = { chunk_size:32678}
}

RedisSparseBitmap.prototype.setbit = function(key,offset,value , callback) {
  var chunk_offset = offset % this.options.chunk_size
  var chunk_id = (offset - chunk_offset) / this.options.chunk_size

  var sub_key = key + ':' + chunk_id
  this.redis.setbit(sub_key,chunk_offset,value,callback)
}


module.exports = RedisSparseBitmap
