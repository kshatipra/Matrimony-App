import { Picker } from '@react-native-picker/picker';
import { Text, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  optional?: boolean;
};

export function SelectField({ label, value, onChange, options, placeholder = 'Select…', optional }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-gray-700">
        {label} {optional ? <Text className="text-gray-400">(optional)</Text> : null}
      </Text>
      <View className="overflow-hidden rounded-lg border border-gray-300">
        <Picker selectedValue={value} onValueChange={(v) => onChange(String(v))}>
          <Picker.Item label={placeholder} value="" />
          {options.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>
    </View>
  );
}
