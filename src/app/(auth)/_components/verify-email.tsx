'use client';

import { BadgeCheckIcon, CircleXIcon, Loader } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Card } from '@/components/ui/card';

import { useVerifyEmail } from '../_services/auth-hooks';

const VerifyEmail = () => {
  const { isPending, error, isError } = useVerifyEmail();

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-sm p-6 min-h-[300px] flex flex-col items-center justify-center">
        {isPending ? (
          <>
            <Loader className="animate-spin size-8" />
            <h1 className="text-lh font-semibold text-center">Verifying account...</h1>
          </>
        ) : (
          <>
            {isError ? (
              <>
                <CircleXIcon className="text-red-500 size-8" />
                <h1 className="text-lh font-semibold text-center">Verification failed</h1>
                <p className="text-sm text-muted-foreground">
                  {error?.message || 'Invalid or expired token'}
                </p>
              </>
            ) : (
              <>
                <BadgeCheckIcon className="text-green-500 size-8" />
                <h1 className="text-lh font-semibold text-center">Verification successful</h1>
                <p className="text-sm text-muted-foreground">
                  Your account has been successfully verified.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Home
                </Link>
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default VerifyEmail;
