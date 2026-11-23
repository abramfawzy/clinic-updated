import i18n from '@/shared/i18n'

const pick = (ar, en) => (i18n.language === 'en' ? en || ar : ar || en) || ''

export const mapSpecialty = (s) => ({
  id: s.id,
  name: pick(s.nameAr, s.nameEn),
  nameAr: s.nameAr,
  nameEn: s.nameEn,
})

export function mapDoctor(d) {
  return {
    id: d.id,
    name: d.fullName,
    specialtyId: d.specialtyId,
    specialty: pick(d.specialtyNameAr, d.specialtyNameEn),
    clinicId: d.clinicId,
    clinic: { id: d.clinicId, name: d.clinicName, address: d.clinicCity },
    bio: d.bio,
    yearsOfExperience: d.yearsOfExperience,
    price: d.consultationFee,
    followUpFeePercent: d.followUpFeePercent,
    followUpDiscountPercent: Math.round(100 - Number(d.followUpFeePercent ?? 100)),
    followUpWindowDays: d.followUpWindowDays,
    rating: d.averageRating,
    reviewsCount: d.reviewsCount,
    userId: d.userId,
    email: d.email,
    phone: d.phoneNumber,
    isApproved: d.isApproved,
    isAccountActive: d.isAccountActive,
    clinicIsActive: d.clinicIsActive,
  }
}

export const mapPaged = (data, mapItem) => {
  const rawList = Array.isArray(data) ? data : (data?.items ?? data?.data ?? [])
  const items = rawList.map(mapItem)
  return {
    items,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? items.length,
    totalCount: data?.totalCount ?? items.length,
    totalPages: data?.totalPages ?? 1,
  }
}