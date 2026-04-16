import { useMemo } from 'react'
import { Autocomplete, Box, InputAdornment, TextField, Typography, createFilterOptions } from '@mui/material'
import { HiOutlineBuildingOffice2 } from 'react-icons/hi2'

function getCompanyLabel(company) {
  if (!company) return ''

  const name = String(company.company_name || '').trim()

  if (!name) return ''

  return name
}

export default function CompanySearchSelect({
  id,
  companies = [],
  valueId = '',
  onChange,
  loading = false,
  disabled = false,
  includeNotListed = false,
  placeholder = 'Search company',
  notListedLabel = 'Not Listed',
}) {
  const options = useMemo(() => {
    const companyOptions = companies.map((company) => ({
      id: String(company.id),
      label: getCompanyLabel(company),
      isNotListed: false,
    }))

    if (!includeNotListed) {
      return companyOptions
    }

    return [
      ...companyOptions,
      {
        id: 'not-listed',
        label: notListedLabel,
        isNotListed: true,
      },
    ]
  }, [companies, includeNotListed, notListedLabel])

  const selectedValue = useMemo(() => {
    if (!valueId) return null

    return options.find((option) => option.id === String(valueId)) || null
  }, [options, valueId])

  const filterOptions = createFilterOptions({
    stringify: (option) => option.label,
  })

  return (
    <Autocomplete
      id={id}
      options={options}
      value={selectedValue}
      onChange={(_, newValue) => onChange(newValue ? newValue.id : '')}
      getOptionLabel={(option) => option?.label || ''}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      filterOptions={filterOptions}
      loading={loading}
      disabled={disabled}
      noOptionsText={loading ? 'Loading companies...' : 'No matching companies'}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box sx={{ display: 'flex', flexDirection: 'column', py: 0.5 }}>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: 'text.primary' }}>
              {option.label}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={loading ? 'Loading companies...' : placeholder}
          size="small"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start" sx={{ mr: 1 }}>
                <HiOutlineBuildingOffice2 size={18} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '14px',
              backgroundColor: '#fff',
              fontWeight: 500,
            },
            '& .MuiInputBase-input': {
              paddingTop: '12px',
              paddingBottom: '12px',
            },
          }}
        />
      )}
    />
  )
}