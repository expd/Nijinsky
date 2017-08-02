# Nijinsky
Sparse Redis Bitmap in Node.js

## Installation

`npm install nijinsky`

## Overview
Redis is useful for storing bitmaps for analytics purposes. for example, where a key can represent an event and the offset a user id. when user ids are relatively sparse this representation is inefficient. This is a Node.js client side space efficient implementation for some of the operations on bitmaps that redis provides. `getbits` is particuraly useful in case you need all the bits set in a bitmap returned converted to their respective user ids.

## Examples

``` javascript
var redis_sb = new RedisSparseBitmap() // works with local redis

var max_id = 4294967296

random_ids = _.times(10, function() {
    return _.random(max_offset)
  })

var event_id = 'my event id'

redis_sb.setbit(event_id , random_ids[3] , function(err){...}) // can set a single value
redis_sb.setbit(event_id , random_ids , function(err){...}) // can set multiple values

redis_sb.getbit(event_id , random_ids[3] , function(err , value) {...})
redis_sb.bitcount(event_id , function(err,count) { }) // count == random_ids.length

redis_sb.getbits(event_id , function(err , ids) {...}) // ids.sort() equals random_ids.sort()

```
