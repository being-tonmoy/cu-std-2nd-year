import React from 'react';
import { Helmet } from 'react-helmet-async';
import StudentForm from '../components/StudentForm';
import { useLanguage } from '../hooks/useLanguage';

const FormPage = () => {
  const { t } = useLanguage();

  return (
    <>
      <Helmet>
        <title>{t('formTitle')}</title>
        <meta name="description" content={t('formDescription')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Helmet>
      <StudentForm />
    </>
  );
};

export default FormPage;
