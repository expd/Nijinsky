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

RedisSparseBitmap.prototype.getbit = function(key, offset, callback) {

  var self = this

  var chunk_offset = _offset % self.options.chunk_size
  var chunk_id = (_offset - chunk_offset) / self.options.chunk_size
  var sub_key = key + ':' + chunk_id

  self.redis.getbit(sub_key, chunk_offset, callback)
}

RedisSparseBitmap.prototype.bitcount = function(key, callback) {

  var self = this

  var index_sub_key = key + ':_'

  var p = self.redis.pipeline()

  self.redis.getBuffer(index_sub_key, function(err, data) {
    if (err) {
      callback(err)
    } else {
      var buf = Buffer.from(data)

      var chunk_ids = getBitsFromBuffer(buf, 0)

      _.each(chunk_ids, function(chunk_id) {
        var sub_key = key + ':' + chunk_id
        p.bitcount(sub_key)
      })

      p.exec(function(err, data) {
        if (err) {
          callback(err)
        } else {
          var sum = _.reduce(data, function(memo, _data) {
            return memo + _data[1];
          }, 0);

          callback(null, sum)
        }
      })
    }
  })
}

RedisSparseBitmap.prototype.getbits = function(key, callback) {

  var self = this

  var index_sub_key = key + ':_'

  var p = self.redis.pipeline()

  self.redis.getBuffer(index_sub_key, function(err, data) {
    if (err) {
      callback(err)
    } else {
      if (_.isEmpty(data)) {
        return callback(null, [])
      }

      var buf = Buffer.from(data)

      var chunk_ids = getBitsFromBuffer(buf, 0)

      _.each(chunk_ids, function(chunk_id) {
        var sub_key = key + ':' + chunk_id
        p.getBuffer(sub_key)
      })

      p.exec(function(err, data) {
        if (err) {
          callback(err)
        } else {
          var ids = _.flatten(_.map(data, function(_data, i) {
            //console.log(i, _data.length)
            var buf = Buffer.from(_data[1])

            return getBitsFromBuffer(buf, chunk_ids[i] * self.options.chunk_size)
          }))

          callback(null, ids)
        }
      })
    }
  })
}

function getBitsFromBuffer(buf, offset) {
  var ids = []

  for (var i = 0; i < buf.length; i++) {
    if (buf[i] != 0) {
      var base = offset + i * 8
      for (var j = 0; j < 8; j++) {
        if ((buf[i] >> j) & 1 == 1) ids.push(base + 7 - j)
      }
    }
  }

  return ids
}




module.exports = RedisSparseBitmap
