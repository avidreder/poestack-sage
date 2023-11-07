import { concatMap, from, groupBy, map, mergeMap, of, toArray } from 'rxjs'
import { scanKeys } from './utils'
import Redis from 'ioredis'
import process from 'process'

const client = new Redis({
  host: process.env['REDIS_URL'] ?? 'localhost',
  port: 6379,
  tls: undefined
})

function cleanShard(shard: string) {
  console.log('cleaning', shard)
  return of(shard).pipe(
    mergeMap((e) =>
      from(client.hgetall(e)).pipe(map((r) => ({ shard: e, listings: Object.entries(r) })))
    ),
    mergeMap((e) => {
      const mappedListings = e.listings.map(([k, v]) => {
        const timestampMs = parseInt(v.split(',')[0]) * 60 * 1000
        const ageMs = Date.now() - timestampMs
        return { shard: e.shard, key: k, hash: k.split(':')[0], ageMs: ageMs }
      })
      return mappedListings
    }),
    groupBy((e) => e.hash),
    mergeMap((e) => e.pipe(toArray())),
    map((e) => {
      e.sort((a, b) => a.ageMs - b.ageMs)
      return [...e.slice(200), ...e.slice(0, 200).filter((e) => e.ageMs > 1000 * 60 * 60 * 48)]
    }),
    toArray(),
    mergeMap((e) => {
      const multi = client.multi()

      for (const group of e) {
        if (group.length) {
          console.log(group[0].shard, group.length)
          multi.hdel(group[0].shard, ...group.map((e) => e.key))
        }
      }

      return from(multi.exec())
    })
  )
}

scanKeys(client, 'psev6:*')
  .pipe(concatMap((shard) => cleanShard(shard)))
  .subscribe({
    complete: () => {
      client.disconnect(false)
    }
  })
