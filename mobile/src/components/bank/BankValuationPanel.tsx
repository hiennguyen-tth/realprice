import React, {useState} from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {formatVND, formatPricePerM2} from '../../utils/formatPrice';
import LoanCalculator from './LoanCalculator';
import type {BankValuationResponse} from '../../types';

interface BankValuationPanelProps {
  data: BankValuationResponse | undefined;
  isLoading?: boolean;
}

export default function BankValuationPanel({
  data,
  isLoading,
}: BankValuationPanelProps): React.JSX.Element {
  const [loanModalBank, setLoanModalBank] = useState<{
    bankName: string;
    maxLoan: number;
    rate: number;
  } | null>(null);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Đang tải định giá ngân hàng…</Text>
      </View>
    );
  }

  if (!data || data.valuations.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Chưa có dữ liệu định giá ngân hàng</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        <Text style={styles.title}>Định giá ngân hàng</Text>
        <Text style={styles.subtitle}>
          Giá thị trường: {formatVND(data.marketPricePerM2)}/m² •{' '}
          {data.area} m²
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.table}>
            {/* Header */}
            <View style={styles.headerRow}>
              <Text style={[styles.cell, styles.bankCell, styles.headerText]}>
                Ngân hàng
              </Text>
              <Text style={[styles.cell, styles.headerText]}>Định giá/m²</Text>
              <Text style={[styles.cell, styles.headerText]}>Tổng định giá</Text>
              <Text style={[styles.cell, styles.headerText]}>LTV</Text>
              <Text style={[styles.cell, styles.headerText]}>Cho vay tối đa</Text>
              <Text style={[styles.cell, styles.headerText]}>vs Thị trường</Text>
              <Text style={[styles.cell, styles.actionCell, styles.headerText]}>
                Tính lãi
              </Text>
            </View>

            {/* Rows */}
            {data.valuations.map(v => {
              const vsMarket = v.vsMarketPercent;
              const isBelowMarket = vsMarket < -10;

              return (
                <View key={v.bankId} style={styles.dataRow}>
                  <Text
                    style={[styles.cell, styles.bankCell, styles.bankName]}>
                    {v.bankName}
                  </Text>
                  <Text style={[styles.cell, styles.cellText]}>
                    {formatPricePerM2(v.valuationPerM2)}
                  </Text>
                  <Text style={[styles.cell, styles.cellText]}>
                    {formatVND(v.totalValuation)}
                  </Text>
                  <Text style={[styles.cell, styles.cellText]}>
                    {(v.ltv * 100).toFixed(0)}%
                  </Text>
                  <Text style={[styles.cell, styles.loanText]}>
                    {formatVND(v.maxLoanAmount)}
                  </Text>
                  <View style={[styles.cell, styles.vsCell]}>
                    <Text
                      style={[
                        styles.vsText,
                        {
                          color:
                            vsMarket >= 0 ? '#16A34A' : '#DC2626',
                        },
                      ]}>
                      {vsMarket >= 0 ? '+' : ''}
                      {vsMarket.toFixed(1)}%
                    </Text>
                    {isBelowMarket && (
                      <Text style={styles.warningIcon}>⚠️</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.cell, styles.actionCell, styles.calcBtn]}
                    onPress={() =>
                      setLoanModalBank({
                        bankName: v.bankName,
                        maxLoan: v.maxLoanAmount,
                        rate: v.interestRate,
                      })
                    }>
                    <Text style={styles.calcBtnText}>Tính</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </ScrollView>

        {/* Below-market warning */}
        {data.valuations.some(v => v.vsMarketPercent < -10) && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ Một số ngân hàng định giá thấp hơn giá thị trường 10%+. Khoản
              vay có thể không đủ để mua bất động sản này.
            </Text>
          </View>
        )}
      </View>

      {/* Loan Calculator Modal */}
      {loanModalBank && (
        <Modal
          visible
          transparent
          animationType="slide"
          onRequestClose={() => setLoanModalBank(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  Tính lịch trả nợ – {loanModalBank.bankName}
                </Text>
                <TouchableOpacity onPress={() => setLoanModalBank(null)}>
                  <Text style={styles.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <LoanCalculator
                initialLoanAmount={loanModalBank.maxLoan}
                initialRate={loanModalBank.rate}
              />
            </View>
          </View>
        </Modal>
      )}
    </>
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
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  table: {
    flexDirection: 'column',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 4,
  },
  dataRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  cell: {
    width: 90,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  bankCell: {
    width: 80,
  },
  actionCell: {
    width: 60,
  },
  vsCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 90,
    paddingHorizontal: 6,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textAlign: 'center',
  },
  bankName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  cellText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  loanText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
    textAlign: 'center',
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  warningIcon: {
    fontSize: 12,
  },
  calcBtn: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  calcBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2563EB',
  },
  warningBanner: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    lineHeight: 18,
  },
  loading: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  empty: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  closeBtn: {
    fontSize: 18,
    color: '#6B7280',
    padding: 4,
  },
});
