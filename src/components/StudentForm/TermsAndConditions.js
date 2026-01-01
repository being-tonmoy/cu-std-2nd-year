import React from 'react';
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider
} from '@mui/material';

const TermsAndConditions = ({
  t, 
  formData, 
  errors, 
  loading,
  onCheckboxChange
}) => {
  return (
    <>
      <Divider sx={{ my: 4 }} />
      <Box sx={{ mb: 4 }}>
        <FormControlLabel
          control={
            <Checkbox
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={onCheckboxChange}
              disabled={loading}
              sx={{
                '&.Mui-checked': {
                  color: '#001f3f'
                }
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: '#333' }}>
              {t('termsAndConditions')}
            </Typography>
          }
        />
        {errors.agreeToTerms && (
          <Typography color="error" variant="caption" className="block mt-2">
            {errors.agreeToTerms}
          </Typography>
        )}
      </Box>
    </>
  );
};

export default TermsAndConditions;
