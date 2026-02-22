import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase';

const REMINDERS = [
  { id: '1', patient: 'John Doe', medicine: 'Lisinopril', time: '8:00 AM', urgent: false },
  { id: '2', patient: 'Jane Smith', medicine: 'Metformin', time: '9:30 AM', urgent: true },
  { id: '3', patient: 'Bob Lee', medicine: 'Vitamin D3', time: '12:00 PM', urgent: false },
];

interface Medicine {
  name: string;
  totalPillsPrescribed: string;
  pillsPerDayToBeTaken: string;
  daysPerWeekToTakeThePrescription: string;
  pillSchedule: string;
  refillOrNot: boolean;
}

interface Patient {
  id: string;
  name: string;
  patientId: string;
  age?: number | string;
  dob?: string;
  gender?: string;
  status?: string;
  pillsAlert?: boolean;
}

export default function HomeScreen() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [optionsModalVisible, setOptionsModalVisible] = useState(false);
  const [manualModalVisible, setManualModalVisible] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [medicines, setMedicines] = useState<Medicine[]>([]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, 'patients'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const pList: Patient[] = [];
      snapshot.forEach((doc) => {
        pList.push({ id: doc.id, ...doc.data() } as Patient);
      });
      setPatients(pList);
    });

    return () => unsubscribe();
  }, []);

  const addMedicineField = () => {
    setMedicines([...medicines, {
      name: '',
      totalPillsPrescribed: '',
      pillsPerDayToBeTaken: '',
      daysPerWeekToTakeThePrescription: '',
      pillSchedule: '',
      refillOrNot: false
    }]);
  };

  const updateMedicine = (index: number, field: keyof Medicine, value: any) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const removeMedicine = (index: number) => {
    const updated = [...medicines];
    updated.splice(index, 1);
    setMedicines(updated);
  };

  const handleSavePatient = async () => {
    if (!name || !idNumber) {
      Alert.alert('Missing Info', 'Name and ID Number are required.');
      return;
    }
    if (!db) {
      Alert.alert('Database Error', 'Firebase database is not connected.');
      return;
    }

    try {
      await addDoc(collection(db, 'patients'), {
        name,
        patientId: idNumber,
        dob,
        gender,
        phone,
        email,
        emergencyContact,
        height,
        weight,
        notes,
        medicines,
        status: 'stable',
        pillsAlert: false,
        createdAt: new Date().toISOString()
      });
      setManualModalVisible(false);
      // Clear form
      setName(''); setIdNumber(''); setDob(''); setGender(''); setPhone('');
      setEmail(''); setEmergencyContact(''); setHeight(''); setWeight('');
      setNotes(''); setMedicines([]);
    } catch (error) {
      console.error('Error adding patient: ', error);
      Alert.alert('Error', 'Could not save patient data.');
    }
  };

  const filteredPatients = patients.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Good Morning 👋</Text>
          <Text style={styles.headerName}>Dr. Sarah Smith</Text>
        </View>
        <TouchableOpacity style={styles.notifButton}>
          <Ionicons name="notifications-outline" size={24} color="#1C1C1E" />
          <View style={styles.notifBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Reminders</Text>
          <TouchableOpacity><Text style={styles.seeAll}>See All</Text></TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.remindersRow}>
          {REMINDERS.map((r) => (
            <View key={r.id} style={[styles.reminderCard, r.urgent && styles.reminderCardUrgent]}>
              <View style={[styles.reminderIcon, r.urgent && styles.reminderIconUrgent]}>
                <Ionicons name="alarm-outline" size={18} color={r.urgent ? '#FF9500' : '#007AFF'} />
              </View>
              <Text style={styles.reminderTime}>{r.time}</Text>
              <Text style={styles.reminderMed} numberOfLines={1}>{r.medicine}</Text>
              <Text style={styles.reminderPatient} numberOfLines={1}>{r.patient}</Text>
              {r.urgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentBadgeText}>LOW STOCK</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.searchWrapper}>
          <Ionicons name="search-outline" size={20} color="#8E8E93" style={{ marginRight: 8 }} />
          <TextInput
            placeholder="Search patients..."
            placeholderTextColor="#C7C7CC"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Patients</Text>
          <View style={styles.countBadge}><Text style={styles.countBadgeText}>{filteredPatients.length} Total</Text></View>
        </View>

        <View style={styles.patientsList}>
          {filteredPatients.map((p) => (
            <TouchableOpacity key={p.id} style={styles.patientCard} activeOpacity={0.75} onPress={() => router.push({ pathname: '/patient-profile', params: { id: p.id, name: p.name } } as any)}>
              <View style={styles.patientLeft}>
                <View style={styles.patientAvatar}>
                  <Text style={styles.patientAvatarText}>{p.name.charAt(0)}</Text>
                </View>
                <View>
                  <Text style={styles.patientName}>{p.name}</Text>
                  <Text style={styles.patientMeta}>ID #{p.patientId} • {p.dob || p.age || 'N/A'} • {p.gender || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.patientRight}>
                <View style={[styles.statusBadge, p.status === 'stable' ? styles.statusStable : styles.statusAttention]}>
                  <Text style={[styles.statusText, p.status === 'stable' ? styles.statusTextStable : styles.statusTextAttention]}>
                    {p.status === 'stable' ? 'Stable' : 'Attention'}
                  </Text>
                </View>
                {p.pillsAlert && (
                  <View style={styles.pillAlert}>
                    <Ionicons name="warning-outline" size={12} color="#FF9500" />
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => setOptionsModalVisible(true)}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Options Modal */}
      <Modal visible={optionsModalVisible} transparent={true} animationType="fade">
        <View style={styles.optionsModalOverlay}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.optionsModalTitle}>Add New Patient</Text>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setOptionsModalVisible(false);
                setManualModalVisible(true);
              }}>
              <Ionicons name="create-outline" size={24} color="#007AFF" />
              <Text style={styles.optionButtonText}>1. Manually Input Patient Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={() => {
                setOptionsModalVisible(false);
                Alert.alert("Coming Soon", "The Record & Scrape feature is not implemented yet!");
              }}>
              <Ionicons name="mic-outline" size={24} color="#FF3B30" />
              <Text style={[styles.optionButtonText, { color: '#FF3B30' }]}>2. Record & Scrape Data</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelOptionButton} onPress={() => setOptionsModalVisible(false)}>
              <Text style={styles.cancelOptionText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Manual Add Patient Modal */}
      <Modal visible={manualModalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setManualModalVisible(false)}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>New Patient</Text>
          <TouchableOpacity onPress={handleSavePatient}>
            <Text style={styles.saveButton}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer} contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={styles.sectionHeading}>Basic Information</Text>
          <TextInput style={styles.input} placeholder="Patient Name" value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="ID Number" value={idNumber} onChangeText={setIdNumber} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="DOB (MM/DD/YYYY)" value={dob} onChangeText={setDob} />
          <TextInput style={styles.input} placeholder="Gender" value={gender} onChangeText={setGender} />
          <TextInput style={styles.input} placeholder="Height" value={height} onChangeText={setHeight} />
          <TextInput style={styles.input} placeholder="Weight" value={weight} onChangeText={setWeight} />
          <TextInput style={[styles.input, { height: 80 }]} placeholder="Notes, History (Optional)" value={notes} onChangeText={setNotes} multiline />

          <Text style={styles.sectionHeading}>Contact Details</Text>
          <TextInput style={styles.input} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Emergency Contact (Name/Phone)" value={emergencyContact} onChangeText={setEmergencyContact} />

          <View style={styles.medicineHeader}>
            <Text style={styles.sectionHeading}>Medicines</Text>
            <TouchableOpacity onPress={addMedicineField} style={styles.addMedicineBtn}>
              <Ionicons name="add-circle" size={20} color="#007AFF" />
              <Text style={styles.addMedicineText}>Add Med</Text>
            </TouchableOpacity>
          </View>

          {medicines.map((med, index) => (
            <View key={index} style={styles.medicineBox}>
              <View style={styles.medicineBoxHeader}>
                <Text style={styles.medicineBoxTitle}>Medicine #{index + 1}</Text>
                <TouchableOpacity onPress={() => removeMedicine(index)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              <TextInput style={styles.input} placeholder="Name of medicine" value={med.name} onChangeText={(v) => updateMedicine(index, 'name', v)} />
              <TextInput style={styles.input} placeholder="Total Pills Prescribed" value={med.totalPillsPrescribed} onChangeText={(v) => updateMedicine(index, 'totalPillsPrescribed', v)} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Pills per Day To Be Taken" value={med.pillsPerDayToBeTaken} onChangeText={(v) => updateMedicine(index, 'pillsPerDayToBeTaken', v)} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Days Per Week To Take" value={med.daysPerWeekToTakeThePrescription} onChangeText={(v) => updateMedicine(index, 'daysPerWeekToTakeThePrescription', v)} keyboardType="numeric" />
              <TextInput style={styles.input} placeholder="Pill Schedule (e.g. 8:00 AM, Daily)" value={med.pillSchedule} onChangeText={(v) => updateMedicine(index, 'pillSchedule', v)} />
              <View style={styles.switchRow}>
                <Text style={{ fontSize: 15, color: '#1C1C1E' }}>Refill Notification</Text>
                <Switch value={med.refillOrNot} onValueChange={(v) => updateMedicine(index, 'refillOrNot', v)} />
              </View>
            </View>
          ))}

        </ScrollView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerGreeting: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  headerName: { fontSize: 20, fontWeight: '800', color: '#0055D4', letterSpacing: -0.3 },
  notifButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center' },
  notifBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF3B30', borderWidth: 1.5, borderColor: '#fff' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.3 },
  seeAll: { fontSize: 14, fontWeight: '600', color: '#007AFF' },
  remindersRow: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },
  reminderCard: { width: 140, backgroundColor: '#fff', borderRadius: 20, padding: 14, gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  reminderCardUrgent: { borderWidth: 1.5, borderColor: '#FF9500' },
  reminderIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  reminderIconUrgent: { backgroundColor: '#FFF3E0' },
  reminderTime: { fontSize: 15, fontWeight: '800', color: '#1C1C1E' },
  reminderMed: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  reminderPatient: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  urgentBadge: { marginTop: 6, backgroundColor: '#FFF3E0', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  urgentBadgeText: { fontSize: 9, fontWeight: '800', color: '#FF9500', letterSpacing: 0.5 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, marginHorizontal: 20, marginTop: 16, paddingHorizontal: 14, height: 48, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  searchInput: { flex: 1, fontSize: 16, color: '#1C1C1E' },
  countBadge: { backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#8E8E93' },
  patientsList: { paddingHorizontal: 20, gap: 10 },
  patientCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  patientLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  patientAvatar: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center' },
  patientAvatarText: { fontSize: 20, fontWeight: '800', color: '#007AFF' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  patientMeta: { fontSize: 12, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  patientRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusStable: { backgroundColor: '#E8F5E9' },
  statusAttention: { backgroundColor: '#FFF8E1' },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  statusTextStable: { color: '#2E7D32' },
  statusTextAttention: { color: '#F57F17' },
  pillAlert: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 60, height: 60, borderRadius: 18, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 },

  // Modal specific
  optionsModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  optionsModalContent: { backgroundColor: '#fff', width: '100%', borderRadius: 14, padding: 20, alignItems: 'center' },
  optionsModalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#1C1C1E' },
  optionButton: { flexDirection: 'row', alignItems: 'center', width: '100%', padding: 16, backgroundColor: '#F2F2F7', borderRadius: 12, marginBottom: 12 },
  optionButtonText: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 12 },
  cancelOptionButton: { marginTop: 10, padding: 12 },
  cancelOptionText: { fontSize: 17, color: '#8E8E93', fontWeight: '500' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', paddingTop: 60 },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  cancelButton: { fontSize: 17, color: '#007AFF' },
  saveButton: { fontSize: 17, fontWeight: '600', color: '#007AFF' },
  formContainer: { padding: 20, backgroundColor: '#F2F2F7' },
  sectionHeading: { fontSize: 16, fontWeight: 'bold', color: '#8E8E93', marginTop: 10, marginBottom: 10, textTransform: 'uppercase' },
  input: { backgroundColor: '#fff', height: 50, borderRadius: 10, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, borderColor: '#E5E5EA', marginBottom: 12 },
  medicineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 10 },
  addMedicineBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF4FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  addMedicineText: { color: '#007AFF', fontWeight: '600', marginLeft: 6 },
  medicineBox: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: '#E5E5EA' },
  medicineBoxHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  medicineBoxTitle: { fontWeight: 'bold', fontSize: 16, color: '#1C1C1E' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 }
});
