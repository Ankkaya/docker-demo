import { areaList } from '@vant/area-data'

export interface RegionOption {
  label: string
  value: string
}

const provinceEntries = Object.entries(areaList.province_list)
const cityEntries = Object.entries(areaList.city_list)
const districtEntries = Object.entries(areaList.county_list)

const provinces = provinceEntries.map(([value, label]) => ({ value, label }))

const municipalityCodes = new Set(['11', '12', '31', '50'])

function sortByCode(a: RegionOption, b: RegionOption) {
  return a.value.localeCompare(b.value)
}

export function getProvinceOptions(): RegionOption[] {
  return provinces
}

export function getCityOptions(provinceCode?: string | null): RegionOption[] {
  if (!provinceCode)
    return []

  const prefix = provinceCode.slice(0, 2)
  return cityEntries
    .filter(([code]) => code.slice(0, 2) === prefix)
    .map(([value, label]) => ({ value, label }))
    .sort(sortByCode)
}

export function getDistrictOptions(cityCode?: string | null): RegionOption[] {
  if (!cityCode)
    return []

  const prefix = cityCode.slice(0, 4)
  return districtEntries
    .filter(([code]) => code.slice(0, 4) === prefix)
    .map(([value, label]) => ({ value, label }))
    .sort(sortByCode)
}

export function normalizeRegionNames(
  province?: string | null,
  city?: string | null,
  district?: string | null,
) {
  const normalizedProvince = province || ''
  const normalizedCity = municipalityCodes.has(findProvinceCodeByName(normalizedProvince)?.slice(0, 2) || '')
    ? (city || normalizedProvince)
    : (city || '')

  return {
    province: normalizedProvince,
    city: normalizedCity,
    district: district || '',
  }
}

export function buildFullRegion(
  province?: string | null,
  city?: string | null,
  district?: string | null,
) {
  const normalized = normalizeRegionNames(province, city, district)
  return [normalized.province, normalized.city, normalized.district].filter(Boolean).join(' ')
}

export function buildRegionColumns(regionCodes: string[] = []) {
  const [provinceCode, cityCode] = regionCodes
  return [
    getProvinceOptions(),
    getCityOptions(provinceCode),
    getDistrictOptions(cityCode),
  ]
}

export function findProvinceCodeByName(name?: string | null) {
  if (!name)
    return ''

  const matched = provinceEntries.find(([, label]) => label === name)
  return matched?.[0] || ''
}

export function findCityCodeByName(provinceCode: string, cityName?: string | null) {
  if (!provinceCode || !cityName)
    return ''

  const cities = getCityOptions(provinceCode)
  const matched = cities.find(item => item.label === cityName)
  return matched?.value || ''
}

export function findDistrictCodeByName(cityCode: string, districtName?: string | null) {
  if (!cityCode || !districtName)
    return ''

  const districts = getDistrictOptions(cityCode)
  const matched = districts.find(item => item.label === districtName)
  return matched?.value || ''
}

export function findRegionCodesByNames(
  province?: string | null,
  city?: string | null,
  district?: string | null,
) {
  const provinceCode = findProvinceCodeByName(province)
  if (!provinceCode)
    return []

  const normalizedCity = municipalityCodes.has(provinceCode.slice(0, 2))
    ? (city || province)
    : city
  const cityCode = findCityCodeByName(provinceCode, normalizedCity)
  if (!cityCode)
    return [provinceCode]

  const districtCode = findDistrictCodeByName(cityCode, district)
  return districtCode ? [provinceCode, cityCode, districtCode] : [provinceCode, cityCode]
}
