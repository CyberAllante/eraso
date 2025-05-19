import settingServices from '@/server/settings/setting-services';
import { Metadata } from 'next';
import React, { cache } from 'react';

import VerifyEmail from '../_components/verify-email';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await cache(settingServices.publicSettings)();

  return {
    title: `Verify Email - ${settings?.general?.applicationName || ''}`,
  };
}

const VerifyEmailPage = () => {
  return <VerifyEmail />;
};

export default VerifyEmailPage;
