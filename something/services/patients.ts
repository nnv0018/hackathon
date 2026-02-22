import { collection, addDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db, auth } from "./firebase";

//Get the current logged in user's patients collection reference
function getPatientsCollection() {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return collection(db, "users", user.uid, "patients");
}
//subscribe to patients collection changes and call the callback with the updated list of patients
export function subscribeToPatients(callback: (patients: any[]) => void) {
  const ref = getPatientsCollection();
  const q = query(ref, orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(list);
  });
}
//add a new patient to the current logged in user's patients collection
export async function addPatient(data: object) {
  const ref = getPatientsCollection();
  return addDoc(ref, { ...data, createdAt: new Date().toISOString() });
}