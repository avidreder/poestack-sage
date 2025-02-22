import { HttpUtil, ItemGroupingService, PoeItem, PoePublicStashResponse, SageItemGroup } from 'sage-common'
import { debounceTime, from, Subject } from 'rxjs'
import process from 'process'
import Redis from 'ioredis'
import { twoDecimals } from './utils'

const divineTypes = new Set(['d', 'div', 'divine'])
const chaosTypes = new Set(['c', 'chaos'])
const extractCurrencyType = (currencyTypeRaw: string): string | null => {
  const formattedType = currencyTypeRaw?.trim()?.toLowerCase()

  if (!formattedType?.length) return null
  if (chaosTypes.has(formattedType)) return 'c'
  if (divineTypes.has(formattedType)) return 'd'

  return null
}

const extractCurrencyValue = (currencyValueRaw: string): string | null => {
  try {
    let numericValue: number
    if (currencyValueRaw.includes('/')) {
      const split = currencyValueRaw.split('/')
      numericValue = parseFloat(split[0]) / parseFloat(split[1])
    } else {
      numericValue = parseFloat(currencyValueRaw)
    }

    if (numericValue) {
      return twoDecimals(numericValue).toString()
    }
  } catch (e) {
    // @ts-ignore
  }
  return null
}

const httpUtil = new HttpUtil()

function loadChanges(paginationCode: string) {
  return httpUtil.get<PoePublicStashResponse>(
    `https://api.pathofexile.com/public-stash-tabs?id=${paginationCode}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GGG_SERVICE_AUTH_TOKEN}`,
        'User-Agent': 'OAuth poestack/1.0.0 (contact: zgherridge@gmail.com)'
      }
    }
  )
}

const itemGroupingService = new ItemGroupingService()
const resultsSubject = new Subject<PoePublicStashResponse>()

resultsSubject.pipe(debounceTime(3500)).subscribe((e) => {
  console.log('loading', e.next_change_id)
  loadChanges(e.next_change_id).subscribe((e) => {
    resultsSubject.next(e)
  })
})

const client = new Redis(process.env['REDIS_URL'])

const groupsWritten = new Set<string>()
function writeGroup(group: SageItemGroup, item: PoeItem) {
  if (!groupsWritten.has(group.hash)) {
    const summary = { k: group.key, i: item.icon?.replaceAll("https://web.poecdn.com/gen/image/", "") }

    const shard = parseInt(group.hash, 16) % 5
    from(client.hset(
      `gss:${group.tag}:${shard}`,
      `${group.hash}`,
      JSON.stringify(summary)
    )).subscribe()

    groupsWritten.add(group.hash)
  }
}

resultsSubject.subscribe((data) => {
  try {
    if (data?.stashes) {
      const dateMs = Date.now()
      const dateTruncatedMins = Math.round(dateMs / 1000 / 60)
      let updates = 0
      const multi = client.multi()
      for (const stashData of data.stashes) {
        if (
          !stashData.league ||
          stashData.league.includes('(PL') ||
          stashData.league.includes('SSF') ||
          stashData.league.includes('Solo Self Found') ||
          stashData.league.includes('Ruthless')
        ) {
          continue
        }

        const toWrite: Record<
          string,
          {
            stackSize: number
            value: string
            currencyType: string
            tag: string
          }
        > = {}
        for (const item of stashData.items) {
          const note = item.note ?? item.forum_note ?? stashData.stash
          if (note.length > 3 && (note.includes('~b/o ') || note.includes('~price '))) {
            const group = itemGroupingService.group(item)
            if (group) {
              writeGroup(group, item)

              const noteSplit = note.trim().split(' ')
              var valueString = extractCurrencyValue(noteSplit[1])
              var currencyType = extractCurrencyType(noteSplit[2])

              //Chaos Orb override
              if (group.hash === "dac72c76c8099a3cc512ba2d9961db84036694cc") {
                valueString = "1"
                currencyType = "c"
              }

              if (valueString?.length && currencyType?.length) {
                if (!toWrite[group.hash]) {
                  toWrite[group.hash] = {
                    stackSize: 0,
                    value: valueString,
                    currencyType: currencyType,
                    tag: group.tag
                  }
                }

                const doc = toWrite[group.hash]
                doc.stackSize = doc.stackSize + (item.stackSize ?? 1)
              }
            }
          }
        }

        for (const [itemGroupHashString, data] of Object.entries(toWrite)) {
          updates++
          const shard = parseInt(itemGroupHashString, 16) % 5
          multi.hset(
            `psev6:${data.tag}:${shard}:${stashData.league}`,
            `${itemGroupHashString}:${stashData.accountName}`,
            `${dateTruncatedMins},${data.stackSize},${data.value},${data.currencyType}`
          )
        }
      }

      if (updates > 0) {
        multi
          .exec()
          .catch((e) => {
            console.log('error in write', e)
          })
          .finally(() => {
            console.log('finished', updates, 'updates in', Date.now() - dateMs, 'ms')
          })
      }
    }
  } catch (error) {
    console.error(error)
  }
})

resultsSubject.subscribe((e) => console.log('got', e.stashes?.length))

resultsSubject.next({
  next_change_id: '2170425622-2162025115-2092674883-2322724226-2255546785',
  stashes: []
})
