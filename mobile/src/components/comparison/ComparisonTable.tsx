import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {formatVND, formatArea, formatPricePerM2} from '../../utils/formatPrice';
import {calcListingScore, getScoreColor, getScoreLabel} from '../../utils/scoreUtils';
import ScoreBadge from './ScoreBadge';
import type {BankValuation, Listing} from '../../types';

interface ComparisonTableProps {
  listings: Listing[];
  bankValuations?: Record<string, BankValuation[]>; // listingId → valuations
}

const LEGAL_LABELS: Record<string, string> = {
  so_do: 'Sổ đỏ',
  so_hong: 'Sổ hồng',
  hop_dong: 'Hợp đồng',
  giay_to_khac: 'Giấy tờ khác',
  chua_co: 'Chưa có',
};

const COL_WIDTH = 140;
const ROW_LABEL_WIDTH = 120;

interface TableRow {
  label: string;
  key: string;
  render: (listing: Listing, isBest: boolean) => React.ReactNode;
  bestFn?: (values: (number | null)[]) => number; // index of best
}

export default function ComparisonTable({
  listings,
  bankValuations = {},
}: ComparisonTableProps): React.JSX.Element {
  if (listings.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Không có dữ liệu</Text>
      </View>
    );
  }

  // Compute district avg for scoring (simplified: use mean of all)
  const districtAvg =
    listings.reduce((sum, l) => sum + l.pricePerM2, 0) / listings.length;

  const scores = listings.map(l => calcListingScore(l, null, districtAvg));
  const bestScoreIdx = scores.indexOf(Math.max(...scores));
  const cheapestIdx = listings
    .map(l => l.price)
    .reduce((bestIdx, price, idx, arr) => (price < (arr[bestIdx] ?? Infinity) ? idx : bestIdx), 0);

  const rows: TableRow[] = [
    {
      label: 'Giá bán',
      key: 'price',
      render: (l, isBest) => (
        <Text style={[styles.cellValue, isBest && styles.cellValueBest]}>
          {formatVND(l.price)}
        </Text>
      ),
      bestFn: vals => {
        const min = Math.min(...vals.filter((v): v is number => v !== null));
        return vals.findIndex(v => v === min);
      },
    },
    {
      label: 'Giá/m²',
      key: 'pricePerM2',
      render: (l, isBest) => (
        <Text style={[styles.cellValue, isBest && styles.cellValueBest]}>
          {formatPricePerM2(l.pricePerM2)}
        </Text>
      ),
      bestFn: vals => {
        const min = Math.min(...vals.filter((v): v is number => v !== null));
        return vals.findIndex(v => v === min);
      },
    },
    {
      label: 'Diện tích',
      key: 'area',
      render: (l, _) => (
        <Text style={styles.cellValue}>{formatArea(l.area)}</Text>
      ),
    },
    {
      label: 'Pháp lý',
      key: 'legal',
      render: (l, isBest) => (
        <Text style={[styles.cellValue, isBest && styles.cellValueBest]}>
          {LEGAL_LABELS[l.legalStatus] ?? l.legalStatus}
        </Text>
      ),
    },
    {
      label: 'Lối vào',
      key: 'alley',
      render: l => (
        <Text style={styles.cellValue}>
          {l.frontage ? `${l.frontage}m mặt tiền` : l.alleyWidth ? `${l.alleyWidth}m hẻm` : '—'}
        </Text>
      ),
    },
    {
      label: 'Điểm đánh giá',
      key: 'score',
      render: (l, isBest) => (
        <View style={styles.scoreCellWrapper}>
          <ScoreBadge
            score={calcListingScore(l, null, districtAvg)}
            compact
          />
          {isBest && (
            <Text style={styles.bestBadge}>⭐ Tốt nhất</Text>
          )}
        </View>
      ),
      bestFn: vals => {
        const max = Math.max(...vals.filter((v): v is number => v !== null));
        return vals.findIndex(v => v === max);
      },
    },
  ];

  // Add bank valuation rows for available banks
  const allBanks = new Set<string>();
  Object.values(bankValuations).forEach(vals =>
    vals.forEach(v => allBanks.add(v.bankName)),
  );

  allBanks.forEach(bankName => {
    rows.push({
      label: `${bankName}\n(định giá/m²)`,
      key: `bank_${bankName}`,
      render: (l, isBest) => {
        const valuation = bankValuations[l.id]?.find(
          v => v.bankName === bankName,
        );
        if (!valuation) return <Text style={styles.cellValue}>—</Text>;
        return (
          <View>
            <Text style={[styles.cellValue, isBest && styles.cellValueBest]}>
              {formatPricePerM2(valuation.valuationPerM2)}
            </Text>
            <Text style={styles.cellSubValue}>
              Cho vay: {formatVND(valuation.maxLoanAmount)}
            </Text>
          </View>
        );
      },
    });
  });

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.table}>
        {/* Header row */}
        <View style={styles.row}>
          <View style={[styles.headerLabelCell, {width: ROW_LABEL_WIDTH}]} />
          {listings.map((l, idx) => (
            <View
              key={l.id}
              style={[
                styles.headerCell,
                {width: COL_WIDTH},
                idx === bestScoreIdx && styles.headerCellBest,
              ]}>
              <Text style={styles.headerTitle} numberOfLines={2}>
                {l.title}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {l.address}
              </Text>
            </View>
          ))}
        </View>

        {/* Data rows */}
        {rows.map((row, rowIdx) => {
          // Determine best column for this row
          let bestColIdx = -1;
          if (row.bestFn) {
            const vals = listings.map(l => {
              if (row.key === 'price') return l.price;
              if (row.key === 'pricePerM2') return l.pricePerM2;
              if (row.key === 'score')
                return calcListingScore(l, null, districtAvg);
              return null;
            });
            bestColIdx = row.bestFn(vals);
          }

          return (
            <View
              key={row.key}
              style={[styles.row, rowIdx % 2 === 0 && styles.rowEven]}>
              <View
                style={[styles.rowLabelCell, {width: ROW_LABEL_WIDTH}]}>
                <Text style={styles.rowLabel}>{row.label}</Text>
              </View>
              {listings.map((l, colIdx) => (
                <View
                  key={l.id}
                  style={[
                    styles.dataCell,
                    {width: COL_WIDTH},
                    colIdx === bestColIdx && styles.dataCellBest,
                  ]}>
                  {row.render(l, colIdx === bestColIdx)}
                </View>
              ))}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  table: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
  rowEven: {
    backgroundColor: '#F9FAFB',
  },
  headerLabelCell: {
    padding: 12,
    backgroundColor: '#F3F4F6',
  },
  headerCell: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    justifyContent: 'center',
  },
  headerCellBest: {
    backgroundColor: '#FFF7ED',
    borderTopWidth: 3,
    borderTopColor: '#F97316',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  headerSub: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  rowLabelCell: {
    padding: 12,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  dataCell: {
    padding: 12,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  dataCellBest: {
    backgroundColor: '#FFF7ED',
  },
  cellValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  cellValueBest: {
    color: '#F97316',
  },
  cellSubValue: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  scoreCellWrapper: {
    alignItems: 'flex-start',
    gap: 4,
  },
  bestBadge: {
    fontSize: 10,
    color: '#F97316',
    fontWeight: '600',
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
