import SchemeOfWorkPage from '@/components/SOW/schemeOfWork'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers';
import React from 'react'

async function page() {

    const session = await auth.api.getSession({ 
      headers: await headers() 
    });
    if (!session?.user) throw new Error('You must be logged in');


    const userId = session?.user?.id || null;


  return (
    <>
    <SchemeOfWorkPage initialUserId = {userId} />
    </>
  )
}

export default page