import Fuse from 'fuse.js'
import { VariantDB } from '@/firebase/db'

type VariantIndexEntry = {
  id: string
  name: string
  description: string
}

export type VariantIndexResult = {
  id: string
  name: string
  score: number // 0 is best, 1 is worst
  // TODO: matches
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
          weight: 0.2,
        },
      ],
    })
  }
  
  search(query: string, limit: number): VariantIndexResult[] {
    return this.index.search(query, { limit }).map(result => {
      const { item, score } = result
      const { id, name } = item
      if (typeof score === 'undefined') throw new Error('Score is undefined')
      const typedRet: VariantIndexResult = { id, name, score }
      return typedRet
    })
  }
}

let currentIndex: VariantSearchIndex | null = null

export async function searchVariants(query: string): Promise<VariantIndexResult[]> {
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
  
  return currentIndex.search(query, 10)
}
