import React, {useState, useMemo} from 'react';
import {StyleSheet, Text, View} from 'react-native';
import Slider from '@react-native-community/slider'; // requires: npm install @react-native-community/slider
import {formatVND, formatMonthlyPayment} from '../../utils/formatPrice';

interface LoanCalculatorProps {
  initialLoanAmount?: number;
  initialRate?: number;
  initialMonths?: number;
}

export default function LoanCalculator({
  initialLoanAmount = 2_000_000_000,
  initialRate = 9.0,
  initialMonths = 240,
}: LoanCalculatorProps): React.JSX.Element {
  const [loanAmount, setLoanAmount] = useState(initialLoanAmount);
  const [months, setMonths] = useState(initialMonths);
  const [annualRate, setAnnualRate] = useState(initialRate);

  const {monthlyPayment, totalPayment, totalInterest} = useMemo(() => {
    const r = annualRate / 100 / 12;
    if (r === 0) {
      const mp = loanAmount / months;
      return {
        monthlyPayment: mp,
        totalPayment: loanAmount,
        totalInterest: 0,
      };
    }
    // Standard amortization formula
    const mp =
      (loanAmount * r * Math.pow(1 + r, months)) /
      (Math.pow(1 + r, months) - 1);
    const total = mp * months;
    return {
      monthlyPayment: mp,
      totalPayment: total,
      totalInterest: total - loanAmount,
    };
  }, [loanAmount, months, annualRate]);

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  return (
    <View style={styles.container}>
      {/* Loan amount slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Số tiền vay</Text>
          <Text style={styles.sliderValue}>{formatVND(loanAmount)}</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={100_000_000}
          maximumValue={20_000_000_000}
          step={50_000_000}
          value={loanAmount}
          onValueChange={setLoanAmount}
          minimumTrackTintColor="#F97316"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#F97316"
        />
        <View style={styles.rangeRow}>
          <Text style={styles.rangeText}>100 triệu</Text>
          <Text style={styles.rangeText}>20 tỷ</Text>
        </View>
      </View>

      {/* Months slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Thời hạn vay</Text>
          <Text style={styles.sliderValue}>
            {years > 0 ? `${years} năm` : ''}
            {remainingMonths > 0 ? ` ${remainingMonths} tháng` : ''}
          </Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={12}
          maximumValue={300}
          step={6}
          value={months}
          onValueChange={val => setMonths(Math.round(val))}
          minimumTrackTintColor="#F97316"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#F97316"
        />
        <View style={styles.rangeRow}>
          <Text style={styles.rangeText}>1 năm</Text>
          <Text style={styles.rangeText}>25 năm</Text>
        </View>
      </View>

      {/* Interest rate slider */}
      <View style={styles.sliderSection}>
        <View style={styles.sliderHeader}>
          <Text style={styles.sliderLabel}>Lãi suất/năm</Text>
          <Text style={styles.sliderValue}>{annualRate.toFixed(1)}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={5}
          maximumValue={15}
          step={0.5}
          value={annualRate}
          onValueChange={setAnnualRate}
          minimumTrackTintColor="#F97316"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#F97316"
        />
        <View style={styles.rangeRow}>
          <Text style={styles.rangeText}>5%</Text>
          <Text style={styles.rangeText}>15%</Text>
        </View>
      </View>

      {/* Results */}
      <View style={styles.results}>
        <View style={[styles.resultItem, styles.resultHighlight]}>
          <Text style={styles.resultLabel}>Trả hàng tháng</Text>
          <Text style={styles.resultValueMain}>
            {formatMonthlyPayment(monthlyPayment)}
          </Text>
        </View>
        <View style={styles.resultRow}>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Tổng tiền trả</Text>
            <Text style={styles.resultValue}>
              {formatVND(totalPayment)}
            </Text>
          </View>
          <View style={styles.resultItem}>
            <Text style={styles.resultLabel}>Tổng lãi phải trả</Text>
            <Text style={[styles.resultValue, styles.interestColor]}>
              {formatVND(totalInterest)}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.disclaimer}>
        * Kết quả chỉ mang tính tham khảo. Lãi suất thực tế có thể thay đổi
        theo chính sách của từng ngân hàng.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  sliderSection: {
    gap: 4,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
  },
  slider: {
    width: '100%',
    height: 32,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  results: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultItem: {
    flex: 1,
  },
  resultHighlight: {
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resultLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  resultValueMain: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F97316',
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  interestColor: {
    color: '#DC2626',
  },
  disclaimer: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
    fontStyle: 'italic',
  },
});
