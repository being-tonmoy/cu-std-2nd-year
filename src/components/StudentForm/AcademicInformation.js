import React, { useMemo } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Divider
} from '@mui/material';

const AcademicInformation = ({ 
  t, 
  language,
  formData, 
  errors, 
  loading, 
  departments,
  onInputChange,
  facultyData
}) => {
  // Session options
  const SESSIONS = ['2024-25', '2023-24', '2022-23'];
  
  // Safely get faculty list and sort alphabetically - memoized
  const facultyList = useMemo(() => {
    if (facultyData && typeof facultyData === 'object') {
      return Object.values(facultyData)
        .filter(f => f && f.name)
        .sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }, [facultyData]);

  // Sort departments alphabetically - memoized
  const sortedDepartments = useMemo(() => {
    if (departments && Array.isArray(departments)) {
      return [...departments].sort((a, b) => a.localeCompare(b));
    }
    return [];
  }, [departments]);

  // Debug wrapper for onChange
  const handleSelectChange = (e) => {
    console.log('Select changed:', e.target.name, '=', e.target.value);
    onInputChange(e);
  };

  return (
    <>
      <Divider sx={{ my: 4 }} />
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{
            color: '#001f3f',
            fontWeight: 'bold',
            mb: 2,
            fontSize: { xs: '16px', sm: '18px' }
          }}
        >
          {language === 'en' ? 'Academic Information' : 'একাডেমিক তথ্য'}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 2, md: 3 } }}>
          {/* Session and Faculty Row */}
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 2, md: 3 }, flexDirection: { xs: 'column', md: 'row' } }}>
            {/* Session */}
            <FormControl fullWidth error={!!errors.session} required sx={{ flex: 1 }}>
              <InputLabel>{t('session')}</InputLabel>
              <Select
                label={t('session')}
                name="session"
                value={formData.session || ''}
                onChange={handleSelectChange}
                disabled={loading}
              >
                {SESSIONS.map(session => (
                  <MenuItem key={session} value={session}>{session}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Faculty */}
            <FormControl fullWidth error={!!errors.faculty} required sx={{ flex: 1 }}>
              <InputLabel>{t('faculty')}</InputLabel>
              <Select
                label={t('faculty')}
                name="faculty"
                value={formData.faculty || ''}
                onChange={handleSelectChange}
                disabled={loading}
              >
                {facultyList.length > 0 ? (
                  facultyList.map(faculty => (
                    <MenuItem key={faculty.alias} value={faculty.name}>
                      {faculty.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>No faculties available</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>

          {/* Department */}
          <FormControl 
            fullWidth 
            error={!!errors.department} 
            required 
            disabled={!formData.faculty || loading}
          >
            <InputLabel>{t('department')}</InputLabel>
            <Select
              label={t('department')}
              name="department"
              value={formData.department || ''}
              onChange={handleSelectChange}
            >
              {sortedDepartments && sortedDepartments.length > 0 ? (
                sortedDepartments.map(dept => (
                  <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                ))
              ) : (
                <MenuItem value="" disabled>
                  {formData.faculty ? 'No departments available' : 'Please select a faculty first'}
                </MenuItem>
              )}
            </Select>
          </FormControl>

          {/* Year/Semester Type and Value - Combined Row */}
          <Box sx={{ display: 'flex', gap: { xs: 2, sm: 2, md: 3 }, flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'flex-start', md: 'center' } }}>
            {/* Radio Buttons */}
            <FormControl component="fieldset" sx={{ flex: { xs: 1, md: 'auto' } }}>
              <FormLabel component="legend" sx={{ color: '#001f3f', fontWeight: '600', mb: 1 }}>
                {t('currentYearSemester')}
              </FormLabel>
              <RadioGroup
                row
                name="yearSemesterType"
                value={formData.yearSemesterType}
                onChange={onInputChange}
                sx={{ flexWrap: 'nowrap' }}
              >
                <FormControlLabel
                  value="year"
                  control={<Radio size="small" />}
                  label={t('year')}
                  disabled={loading}
                  sx={{ mr: 2 }}
                />
                <FormControlLabel
                  value="semester"
                  control={<Radio size="small" />}
                  label={t('semester')}
                  disabled={loading}
                />
              </RadioGroup>
            </FormControl>

            {/* Dropdown */}
            <FormControl fullWidth error={!!errors.yearSemesterValue} required sx={{ flex: 1 }}>
              <InputLabel>
                {formData.yearSemesterType === 'year' ? t('year') : t('semester')}
              </InputLabel>
              <Select
                label={formData.yearSemesterType === 'year' ? t('year') : t('semester')}
                name="yearSemesterValue"
                value={formData.yearSemesterValue || ''}
                onChange={handleSelectChange}
                disabled={loading}
              >
                {formData.yearSemesterType === 'year' ? [
                  <MenuItem key="1st" value="1st">{t('firstYear')}</MenuItem>,
                  <MenuItem key="2nd" value="2nd">{t('secondYear')}</MenuItem>
                ] : [
                  <MenuItem key="1st" value="1st">{t('firstSemester')}</MenuItem>,
                  <MenuItem key="2nd" value="2nd">{t('secondSemester')}</MenuItem>,
                  <MenuItem key="3rd" value="3rd">{t('thirdSemester')}</MenuItem>
                ]}
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default AcademicInformation;
