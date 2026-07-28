import { Text, TextInput, View, type TextInputProps } from 'react-native';

type Props = TextInputProps & {
  label: string;
  optional?: boolean;
};

export function FormField({ label, optional, ...inputProps }: Props) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-medium text-gray-700">
        {label} {optional ? <Text className="text-gray-400">(optional)</Text> : null}
      </Text>
      <TextInput {...inputProps} className="rounded-lg border border-gray-300 px-4 py-3" />
    </View>
  );
}
