import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToPatients } from '../../services/patients';

type ReminderStatus = 'upcoming' | 'done' | 'missed';

interface Reminder { 
  id: string; 
  patient: string; 
  medicine: string; 
  dosage: string; 
  time: string; 
  status: ReminderStatus; 
  urgent: boolean; 
}

function statusStyle(status: ReminderStatus) {
  switch (status) {
    case 'done':     return { bg: '#E8F5E9', text: '#2E7D32', label: 'Done' };
    case 'missed':   return { bg: '#FFEBEE', text: '#C62828', label: 'Missed' };
    case 'upcoming': return { bg: '#EBF4FF', text: '#007AFF', label: 'Upcoming' };
  }
}

// Helper function to convert "8:00 AM" into a real Date object for today
function parseTimeToToday(timeStr: string): Date {
  if (!timeStr) return new Date();
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':');
  let hrs = parseInt(hours, 10);
  
  if (modifier === 'PM' && hrs < 12) hrs += 12;
  if (modifier === 'AM' && hrs === 12) hrs = 0;

  const date = new Date();
  date.setHours(hrs, parseInt(minutes, 10), 0, 0);
  return date;
}

export default function RemindersScreen() {
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToPatients((patients) => {
      const now = new Date();

      const mappedReminders = patients.map((p: any) => {
        let currentStatus: ReminderStatus = p.status || 'upcoming';

        // Automatically mark as missed if the time has passed and it's not done
        if (currentStatus !== 'done' && p.time) {
          const reminderTime = parseTimeToToday(p.time);
          if (now > reminderTime) {
            currentStatus = 'missed';
          }
        }

        return {
          id: p.id,
          patient: p.name,
          medicine: p.medicine,
          dosage: p.dosage,
          time: p.time,
          status: currentStatus,
          urgent: p.urgent || false,
        };
      });

      // Optional: Sort so 'missed' and 'upcoming' are at the top, 'done' at the bottom
      mappedReminders.sort((a, b) => {
        if (a.status === 'done' && b.status !== 'done') return 1;
        if (b.status === 'done' && a.status !== 'done') return -1;
        return 0;
      });

      setReminders(mappedReminders);
    });

    return () => unsubscribe();
  }, []);

  // Calculate summary
  const total = reminders.length;
  const upcoming = reminders.filter(r => r.status === 'upcoming').length;
  const done = reminders.filter(r => r.status === 'done').length;
  const missed = reminders.filter(r => r.status === 'missed').length;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reminders</Text>
        <Text style={styles.headerDate}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        {[ 
          [total, '#1C1C1E', 'Total'], 
          [upcoming, '#007AFF', 'Upcoming'], 
          [done, '#34C759', 'Done'], 
          [missed, '#FF3B30', 'Missed'] 
        ].map(([num, color, label]) => (
          <View key={label as string} style={styles.summaryCard}>
            <Text style={[styles.summaryNumber, { color: color as string }]}>{num as number}</Text>
            <Text style={styles.summaryLabel}>{label as string}</Text>
          </View>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.cardsList}>
          {reminders.map((r) => {
            const s = statusStyle(r.status);
            return (
              <View key={r.id} style={[styles.reminderCard, r.urgent && styles.reminderCardUrgent]}>
                <View style={styles.reminderLeft}>
                  <View style={[styles.pillIcon, { backgroundColor: s.bg }]}> 
                    <Ionicons name="medical-outline" size={20} color={s.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.reminderTopRow}>
                      <Text style={styles.medicineName}>{r.medicine}</Text>
                      {r.urgent && (
                        <View style={styles.lowStockBadge}>
                          <Text style={styles.lowStockText}>LOW STOCK</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.dosageText}>{r.dosage} · {r.patient}</Text>
                    <View style={styles.timeRow}>
                      <Ionicons name="time-outline" size={13} color="#8E8E93" />
                      <Text style={styles.timeText}>{r.time}</Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: s.bg }]}> 
                  <Text style={[styles.statusText, { color: s.text }]}>{s.label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#1C1C1E', letterSpacing: -0.5 },
  headerDate: { fontSize: 14, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 16, gap: 10 },
  summaryCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  summaryNumber: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#8E8E93', letterSpacing: 0.5, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, marginBottom: 10, marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: 0.8 },
  cardsList: { paddingHorizontal: 20, gap: 10, marginBottom: 8 },
  reminderCard: { backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  reminderCardUrgent: { borderWidth: 1.5, borderColor: '#FF9500' },
  reminderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pillIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reminderTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medicineName: { fontSize: 15, fontWeight: '700', color: '#1C1C1E' },
  lowStockBadge: { backgroundColor: '#FFF3E0', borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  lowStockText: { fontSize: 9, fontWeight: '800', color: '#FF9500', letterSpacing: 0.4 },
  dosageText: { fontSize: 13, color: '#8E8E93', fontWeight: '500', marginTop: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 12, color: '#8E8E93', fontWeight: '600' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
});