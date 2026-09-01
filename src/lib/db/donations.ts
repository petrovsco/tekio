import { supabase } from '../supabase'
import { USER_ID, DONATION_TYPE_MAP, DONATION_TYPE_REVERSE } from '../../constants/app'
import type { DonationEntry } from '../../types'
import { withOrigin } from '../env'

export async function loadDonations(): Promise<DonationEntry[]> {
  const { data, error } = await supabase
    .from('blood_donations')
    .select('id, donation_date, donation_type, notes')
    .eq('user_id', USER_ID)
    .order('donation_date', { ascending: false })
  if (error) throw error
  return (data ?? []).map(r => ({
    id: r.id,
    date: r.donation_date,
    type: (DONATION_TYPE_REVERSE[r.donation_type] ?? r.donation_type) as DonationEntry['type'],
    notes: r.notes ?? '',
  }))
}

export async function saveDonationEntry(entry: Omit<DonationEntry, 'id'>): Promise<DonationEntry> {
  const { data, error } = await supabase
    .from('blood_donations')
    .insert(withOrigin({
      user_id: USER_ID,
      donation_date: entry.date,
      donation_type: DONATION_TYPE_MAP[entry.type] ?? entry.type.toLowerCase().replace(' ', '_'),
      notes: entry.notes ?? null,
    }))
    .select('id, donation_date, donation_type, notes')
    .single()
  if (error) throw error
  return {
    id: data.id,
    date: data.donation_date,
    type: (DONATION_TYPE_REVERSE[data.donation_type] ?? data.donation_type) as DonationEntry['type'],
    notes: data.notes ?? '',
  }
}

export async function deleteDonationEntry(id: string): Promise<void> {
  const { error } = await supabase.from('blood_donations').delete().eq('id', id)
  if (error) throw error
}

export async function updateDonationEntry(
  id: string,
  patch: Omit<DonationEntry, 'id'>
): Promise<void> {
  const { error } = await supabase
    .from('blood_donations')
    .update({
      donation_date: patch.date,
      donation_type: DONATION_TYPE_MAP[patch.type] ?? patch.type.toLowerCase().replace(' ', '_'),
      notes: patch.notes ?? null,
    })
    .eq('id', id)
  if (error) throw error
}
