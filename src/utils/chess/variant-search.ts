import { VariantDB } from '@/firebase/db'
import Fuse from 'fuse.js'

interface VariantIndexEntry {
  id: string
  name: string
  description: string
}
interface VariantIndexEntryWithTags extends VariantIndexEntry {
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
  private dataset: VariantIndexEntryWithTags[]
  // Guaranteed to never match any tags, since the # char is not allowed
  private lastTagsHash = '#'
  
  constructor(variants: VariantIndexEntryWithTags[]) {
    this.dataset = variants
    // First create an empty index. On the first search, it will be populated
    this.index = new Fuse([], {
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
  
  updateIndex(tags: string[]) {
    const tagsHash = tags.join(',')
    if (tagsHash === this.lastTagsHash) return
    this.lastTagsHash = tagsHash
    
    console.log('Updating variant search index for tags:', tags)
    
    // For each input tag, chech if some of the variant's tags match it
    const filteredVariants = this.dataset.filter(variant => {
      for (const tag of tags) {
        if (!variant.tags.some(t => t.startsWith(tag))) return false
      }
      return true
    })
    
    // Remove the tags from the variants to avoid unnecessary indexing
    const variants = filteredVariants.map(variant => {
      const { tags: _, ...rest } = variant
      return rest
    })
    
    // Update the index
    this.index.setCollection(variants)
  }
  
  search(query: string, limit: number, tags: string[]): VariantIndexResult[] {
    this.updateIndex(tags)
    
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
      const [id, name, description, tagStr] = line.split('\t')
      const tags = tagStr.split(',')
      const entry: VariantIndexEntryWithTags = { id, name, description, tags }
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
