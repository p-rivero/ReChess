import { VariantDB } from '@/firebase/db'
import Fuse from 'fuse.js'

type VariantIndexEntry = {
  id: string
  name: string
  description: string
  tags: string[]
}

export type VariantListOrder = 'popular' | 'newest' | 'upvotes'
export type SearchOrder = 'search-relevance' | VariantListOrder

// Default order when not searching
export const DEFAULT_ORDER = 'popular'

export type Match = {start: number, end: number} // end is exclusive
export type VariantIndexResult = {
  id: string
  name: string
  searchScore: number // The search relevance of this result (between 0 and 1)
  sortScore: number // The list is sorted by sortScore in descending order
  matches: Match[]
}

class VariantSearchIndex {
  private index: Fuse<VariantIndexEntry>
  
  constructor(variants: VariantIndexEntry[]) {
    this.index = new Fuse(variants, {
      includeScore: true,
      includeMatches: true,
      keys: [
        {
          name: 'name',
          weight: 1,
        },
        {
          name: 'description',
          weight: 0.15,
        },
        {
          name: 'tags',
          weight: 1,
        },
      ],
    })
  }
  
  search(text: string, limit: number, tags: string[]): VariantIndexResult[] {
    // https://fusejs.io/api/query.html
    let textQuery: Fuse.Expression | undefined = undefined
    let tagQuery: Fuse.Expression[] | undefined = undefined
    if (text !== '') {
      textQuery = { $or: [{ name: text }, { description: text }] }
    }
    if (tags.length > 0) {
      // Exact match the START of all tags
      tagQuery = tags.map(tag => ({ tags: '^' + tag.toLowerCase() }))
    }
    
    let fuseQuery
    if (textQuery && tagQuery) {
      fuseQuery = { $and: [textQuery, ...tagQuery] }
    } else if (textQuery) {
      fuseQuery = textQuery
    } else if (tagQuery) {
      fuseQuery = { $and: tagQuery }
    } else {
      throw new Error('A query was expected but none was provided')
    }
    
    const searchResult = this.index.search(fuseQuery, { limit })
    return searchResult.map(result => {
      const { item, score, matches } = result
      const { id, name } = item
      
      // Fuse.js returns a score of 0 for the best match, so we need to invert it
      if (typeof score === 'undefined') throw new Error('Score is undefined')
      const searchScore = 1 - score
      
      const typedRet: VariantIndexResult = {
        id,
        name,
        searchScore,
        sortScore: NaN, // Set by SearchCard when the variant is loaded
        matches: this.getMatchRanges(matches),
      }
      return typedRet
    })
  }
  
  private getMatchRanges(matches: readonly Fuse.FuseResultMatch[] | undefined): Match[] {
    if (!matches) return []
    const result: Match[] = []
    for (const match of matches) {
      if (match.key !== 'name') continue
      if (!match.value) continue
      for (const range of match.indices) {
        // Add 1 to the end index to make it exclusive
        result.push({ start: range[0], end: range[1] + 1 })
      }
    }
    // If there are any matches of 4 characters or more, only return those
    const longMatches3 = result.filter(({ start, end }) => end - start >= 4)
    if (longMatches3.length > 0) return longMatches3
    // If there are any matches of 2 characters or more, only return those
    const longMatches1 = result.filter(({ start, end }) => end - start >= 2)
    if (longMatches1.length > 0) return longMatches1
    return result
  }
}

let currentIndex: VariantSearchIndex | null = null

export async function searchVariants(query: string, limit: number): Promise<VariantIndexResult[]> {
  // If the index is not yet initialized, fetch it from the server
  if (currentIndex === null) {
    const indexDoc = await VariantDB.getVariantIndex()
    const variants = indexDoc.index.split('\n').map(line => {
      const [id, name, description, tagStr] = line.split('\t')
      const tags = tagStr.split(',')
      const entry: VariantIndexEntry = { id, name, description, tags }
      return entry
    })
    currentIndex = new VariantSearchIndex(variants)
  }
  
  // Extract tags from the query (prefixed with #)
  const TAG_REGEX = /#[^\s#,]+/g
  const tags = query.match(TAG_REGEX)?.map(tag => tag.slice(1).toLowerCase()) ?? []
  
  const queryStr = query
    .replace(TAG_REGEX, '') // Remove tags from the query
    .replace(/\s+/g, ' ')   // Normalize whitespace
    .trim()
    .toLowerCase()
  
  return currentIndex.search(queryStr, limit, tags)
}
