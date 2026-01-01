import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Container, Box, Typography } from '@mui/material';
import { useLanguage } from '../hooks/useLanguage';

const Home = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('home')} | {t('studentForm')}</title>
        <meta name="description" content={t('studentForm')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>

      <Container maxWidth="md" className="py-16">
        <Box className="text-center">
          <Typography variant="h3" component="h1" className="mb-4">
            {t('home')}
          </Typography>
          {/* Add content here as needed */}
        </Box>
      </Container>
    </>
  );
};

export default Home;
