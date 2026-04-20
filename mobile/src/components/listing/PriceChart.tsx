import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {LineChart} from 'react-native-gifted-charts';
import type {PriceHistoryPoint} from '../../types';

interface PriceChartProps {
  data: PriceHistoryPoint[];
  title?: string;
}

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  if (!month) return monthStr;
  return `T${month}`;
}

function formatBillions(value: number): string {
  const billions = value / 1_000_000_000;
  if (billions >= 1) return `${billions.toFixed(1)}T`;
  const millions = value / 1_000_000;
  return `${millions.toFixed(0)}M`;
}

export default function PriceChart({
  data,
  title = 'Biến động giá 6 tháng',
}: PriceChartProps): React.JSX.Element {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Chưa có dữ liệu lịch sử giá</Text>
      </View>
    );
  }

  const chartData = data.map(point => ({
    value: point.avgPricePerM2,
    label: formatMonth(point.month),
    dataPointText: formatBillions(point.avgPricePerM2),
  }));

  const maxPrice = Math.max(...data.map(d => d.maxPrice));
  const minPrice = Math.min(...data.map(d => d.minPrice));
  const priceRange = maxPrice - minPrice;
  const latestChange =
    data.length >= 2
      ? ((data[data.length - 1]!.avgPricePerM2 -
          data[data.length - 2]!.avgPricePerM2) /
          data[data.length - 2]!.avgPricePerM2) *
        100
      : 0;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        <View
          style={[
            styles.changeBadge,
            {
              backgroundColor:
                latestChange >= 0
                  ? '#DCFCE7'
                  : '#FEE2E2',
            },
          ]}>
          <Text
            style={[
              styles.changeText,
              {color: latestChange >= 0 ? '#16A34A' : '#DC2626'},
            ]}>
            {latestChange >= 0 ? '+' : ''}
            {latestChange.toFixed(1)}%
          </Text>
        </View>
      </View>

      <LineChart
        data={chartData}
        width={300}
        height={160}
        color="#F97316"
        thickness={2.5}
        dataPointsColor="#F97316"
        dataPointsRadius={4}
        startFillColor="rgba(249,115,22,0.15)"
        endFillColor="rgba(249,115,22,0)"
        areaChart
        curved
        xAxisLabelTextStyle={styles.axisLabel}
        yAxisTextStyle={styles.axisLabel}
        yAxisTextNumberOfLines={1}
        formatYLabel={val => formatBillions(parseFloat(val))}
        hideRules={false}
        rulesColor="#F3F4F6"
        rulesType="solid"
        yAxisColor="transparent"
        xAxisColor="#E5E7EB"
        noOfSections={4}
        maxValue={maxPrice + priceRange * 0.1}
        isAnimated
        animationDuration={800}
        showDataPointOnFocus
        focusedDataPointColor="#EA580C"
        focusedDataPointRadius={6}
        showTextOnFocus
        textFontSize={11}
        textColor="#374151"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  changeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  axisLabel: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  emptyContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
