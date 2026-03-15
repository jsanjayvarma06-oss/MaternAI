import { collection, addDoc, query, where, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "./firebase";

export const saveReading = async (patientId: string, reading: any) => {
  try {
    const readingWithTimestamp = {
      ...reading,
      patientId,
      timestamp: new Date().toISOString()
    };
    const readingsRef = collection(db, "readings");
    const docRef = await addDoc(readingsRef, readingWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error saving reading: ", error);
    throw error;
  }
};

export const getPatientHistory = async (patientId: string, days: number = 7) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const readingsRef = collection(db, "readings");
    const q = query(
      readingsRef, 
      where("patientId", "==", patientId),
      where("timestamp", ">=", cutoffDate.toISOString()),
      orderBy("timestamp", "desc")
    );
    
    const querySnapshot = await getDocs(q);
    const history: any[] = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    return history.reverse(); // Return in chronological order for charts
  } catch (error) {
    console.error("Error getting patient history: ", error);
    throw error;
  }
};

export const updateAlertStatus = async (patientId: string, alertLevel: string) => {
  try {
    const patientRef = doc(db, "patients", patientId);
    await updateDoc(patientRef, {
      alertLevel,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error updating alert status: ", error);
    throw error;
  }
};
