import Fuse from 'fuse.js'
import { VariantDB } from '@/firebase/db'

type VariantIndexEntry = {
  id: string
  name: string
  description: string
}

export type SearchOrder = 'search-relevance' | 'upvotes' | 'newest'

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
      ],
    })
  }
  
  search(query: string, limit: number): VariantIndexResult[] {
    return this.index.search(query, { limit }).map(result => {
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
      const [id, name, description] = line.split('\t')
      const entry: VariantIndexEntry = { id, name, description }
      return entry
    })
    currentIndex = new VariantSearchIndex(variants)
  }
  
  return currentIndex.search(query, limit)
}
