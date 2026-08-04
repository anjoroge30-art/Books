import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  READING_STATUS_LABELS,
  READING_STATUSES,
  type ReadingStatus,
} from '@/types/book';

type StatusChipsProps = {
  value: ReadingStatus | 'all';
  onChange: (status: ReadingStatus | 'all') => void;
  includeAll?: boolean;
};

export function StatusChips({ value, onChange, includeAll = false }: StatusChipsProps) {
  const theme = useTheme();
  const options: Array<ReadingStatus | 'all'> = includeAll
    ? ['all', ...READING_STATUSES]
    : READING_STATUSES;

  return (
    <View style={styles.row}>
      {options.map((status) => {
        const selected = value === status;
        const label = status === 'all' ? 'All' : READING_STATUS_LABELS[status];

        return (
          <Pressable key={status} onPress={() => onChange(status)}>
            <ThemedView
              type={selected ? 'backgroundSelected' : 'backgroundElement'}
              style={[
                styles.chip,
                {
                  borderColor: selected ? theme.text : theme.textSecondary,
                },
              ]}>
              <ThemedText type={selected ? 'smallBold' : 'small'} themeColor={selected ? 'text' : 'textSecondary'}>
                {label}
              </ThemedText>
            </ThemedView>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.five,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
