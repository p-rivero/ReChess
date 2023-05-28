import { ModerationDoc } from "@/firebase/db/schema"
import type admin from 'firebase-admin'
import { makeCallableContext } from "../make-context"

type DB = admin.firestore.Firestore

/** **WARNING:** Use only for `numReports <= 9` */
export const REPORT_SUMMARY_REGEX = /^(ReporterId\d\tThis is a report from reporter \d\t\d+\n?)+$/

export async function insertModerationDoc(db: DB, type: 'user'|'variant', id: string, numReports: number) {
  const reports = []
  for (let i = 0; i < numReports; i++) {
    const reportTimeMs = Date.now() - i * 1000
    const reportLine = `ReporterId${i}\tThis is a report from reporter ${i}\t${reportTimeMs}`
    if (!REPORT_SUMMARY_REGEX.test(reportLine)) {
      throw new Error('REPORT_SUMMARY_REGEX is incorrect')
    }
    reports.push(reportLine)
  }
  const doc: ModerationDoc = {
    numReports,
    reportsSummary: reports.join('\n'),
  }
  const collectionName = type === 'user' ? 'userModeration' : 'variantModeration'
  await db.collection(collectionName).doc(id).set(doc)
  return doc
}

export function makeModeratorContext(userId: string) {
  return makeCallableContext(userId, true, true, { moderator: true })
}

export function extractReporters(doc: ModerationDoc, ...indexes: number[]): string[] {
  const lines = doc.reportsSummary.split('\n').filter(line => line.length > 0)
  return indexes.map(i => lines[i].split('\t')[0])
}
