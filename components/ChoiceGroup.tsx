import { Pressable, Text, View } from 'react-native';

type Option = { label: string; value: string };

type Props = {
  label: string;
  options: Option[];
  value: string | null | undefined;
  onChange: (value: string) => void;
  optional?: boolean;
};

export function ChoiceGroup({ label, options, value, onChange, optional }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-medium text-gray-700">
        {label} {optional ? <Text className="text-gray-400">(optional)</Text> : null}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              className={`rounded-full border px-4 py-2 ${
                selected ? 'border-rose-600 bg-rose-600' : 'border-gray-300 bg-white'
              }`}>
              <Text className={selected ? 'font-medium text-white' : 'text-gray-700'}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
