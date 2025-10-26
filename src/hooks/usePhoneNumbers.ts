'use client';

import { useState, useEffect } from 'react';

export interface ImportedPhoneNumber {
  phone_number: string;
  last_modification_timestamp: number;
  phone_number_type?: 'retell-twilio' | 'retell-telnyx' | 'custom';
  phone_number_pretty?: string;
  inbound_agent_id?: string | null;
  outbound_agent_id?: string | null;
  inbound_agent_version?: number | null;
  outbound_agent_version?: number | null;
  area_code?: number;
  nickname?: string | null;
  inbound_webhook_url?: string | null;
}

export function usePhoneNumbers() {
  const [phoneNumbers, setPhoneNumbers] = useState<ImportedPhoneNumber[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPhoneNumbers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/phone-numbers');
      const result = await response.json();
      
      if (result.success) {
        setPhoneNumbers(result.data);
      } else {
        console.error('API Error:', result);
        setError(result.error || 'Failed to load phone numbers');
        if (result.details) {
          console.error('Error details:', result.details);
        }
      }
    } catch (err) {
      console.error('Network Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load phone numbers');
    } finally {
      setLoading(false);
    }
  };

  const importPhoneNumber = async (phoneNumberData: any) => {
    try {
      const response = await fetch('/api/phone-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(phoneNumberData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPhoneNumbers(prev => [result.data, ...prev]);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to import phone number');
      }
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  return {
    phoneNumbers,
    loading,
    error,
    loadPhoneNumbers,
    importPhoneNumber,
  };
}
