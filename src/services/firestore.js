import {
  collection,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export function subscribeListings(callback, orderField = "firstSeenAt") {
  const q = query(collection(db, "listings"), orderBy(orderField, "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export function subscribeListing(id, callback) {
  return onSnapshot(doc(db, "listings", id), (snap) => {
    callback(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

export async function updateListingStatus(id, status, extra = {}) {
  await updateDoc(doc(db, "listings", id), { status, ...extra });
}

export function subscribeBrandConfig(callback) {
  return onSnapshot(doc(db, "config", "brand"), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function saveBrandConfig(data) {
  await setDoc(doc(db, "config", "brand"), data, { merge: true });
}

export function subscribeReports(callback) {
  const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

export async function createReport(data) {
  return addDoc(collection(db, "reports"), {
    ...data,
    status: "draft",
    createdAt: serverTimestamp(),
  });
}

export async function markReportSubmitted(id) {
  await updateDoc(doc(db, "reports", id), {
    status: "submitted",
    submittedAt: serverTimestamp(),
  });
}
