import { ModerationDoc, ReportDoc } from "@/firebase/db/schema"
import admin from 'firebase-admin'
import { makeCallableContext } from "../make-context"
import type { Timestamp } from "firebase/firestore"

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

export async function insertReport(db: DB, reporterId: string, type: 'user'|'variant', reportedId: string) {
  const report: ReportDoc = {
    time: admin.firestore.Timestamp.now() as Timestamp,
    reason: `The user ${reporterId} reported the ${type} ${reportedId}`,
    onlyBlock: false,
  }
  const reportedCol = type === 'user' ? 'reportedUsers' : 'reportedVariants'
  await db.collection('users').doc(reporterId).collection(reportedCol).doc(reportedId).set(report)
  
  const moderationCol = type === 'user' ? 'userModeration' : 'variantModeration'
  const moderationDoc = await db.collection(moderationCol).doc(reportedId).get()
  let modDoc: ModerationDoc
  if (!moderationDoc.exists) {
    modDoc = {
      numReports: 1,
      reportsSummary: `${reporterId}\t${report.reason}\t${report.time.toMillis()}`
    }
  } else {
    const oldDoc = moderationDoc.data() as ModerationDoc
    modDoc = {
      numReports: oldDoc.numReports + 1,
      reportsSummary: `${oldDoc.reportsSummary}\n${reporterId}\t${report.reason}\t${report.time.toMillis()}`,
    }
  }
  await db.collection(moderationCol).doc(reportedId).set(modDoc)
}


export function makeModeratorContext(userId: string) {
  return makeCallableContext(userId, true, true, { moderator: true })
}

export function extractReporters(doc: ModerationDoc, ...indexes: number[]): string[] {
  const lines = doc.reportsSummary.split('\n').filter(line => line.length > 0)
  return indexes.map(i => lines[i].split('\t')[0])
}
