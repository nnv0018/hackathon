import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MEDICINES } from '../constants/medicines';

interface Props {
  value: string;
  onSelect: (name: string) => void;
  inputStyle?: any;
}

export function MedicineAutocomplete({ value, onSelect, inputStyle }: Props) {
  const [focused, setFocused] = useState(false);

  const suggestions = focused && value.length >= 1
    ? MEDICINES.filter(m => m.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  return (
    <View>
      <TextInput
        style={inputStyle}
        placeholder="Name of medicine"
        value={value}
        onChangeText={onSelect}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        autoCorrect={false}
        autoCapitalize="words"
      />
      {suggestions.length > 0 && (
        <View style={styles.dropdown}>
          {suggestions.map((name) => (
            <TouchableOpacity
              key={name}
              style={styles.item}
              onPress={() => { onSelect(name); setFocused(false); }}
              activeOpacity={0.7}
            >
              <Text style={styles.itemText}>{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 10,
    marginTop: -8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  itemText: {
    fontSize: 15,
    color: '#1C1C1E',
    fontWeight: '500',
  },
});
