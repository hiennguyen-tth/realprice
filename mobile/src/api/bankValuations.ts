import apiClient from './client';
import type {ApiResponse, BankValuationResponse} from '../types';

export async function getBankValuations(
  landId: string,
): Promise<BankValuationResponse> {
  const response = await apiClient.get<ApiResponse<BankValuationResponse>>(
    `/bank-valuations`,
    {params: {landId}},
  );
  return response.data.data;
}

export async function compareBankValuations(
  landIds: string[],
): Promise<BankValuationResponse[]> {
  const response = await apiClient.post<ApiResponse<BankValuationResponse[]>>(
    `/bank-valuations/compare`,
    {landIds},
  );
  return response.data.data;
}
