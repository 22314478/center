import { NextResponse } from 'next/server';
import { retrieveCheckoutForm } from '@/lib/iyzipay';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const token = formData.get('token');

    const url = new URL(req.url);
    const appointmentId = url.searchParams.get('id');

    if (!token || !appointmentId) {
      return NextResponse.json({ error: 'Missing token or appointment id' }, { status: 400 });
    }

    if (!db) {
       return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    // Retrieve the payment result from iyzico manually
    const result = await retrieveCheckoutForm(token.toString());

    if (result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
      console.error("Iyzico Callback error or failed payment:", result.errorMessage);
      
      try {
        await updateDoc(doc(db!, 'appointments', appointmentId), {
          status: 'cancelled',
          paymentStatus: 'failed',
        });
      } catch (dbErr) {
        console.error("Firebase update error on failed callback:", dbErr);
      }

      // Redirect to booking page with failure
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/book?status=failed`, 302);
    }

    // Payment successful
    const updateData = {
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentId: result.paymentId || token,
    };

    try {
      await updateDoc(doc(db!, 'appointments', appointmentId), updateData);
    } catch (dbErr) {
      console.error("Firebase update error on callback success:", dbErr);
    }

    // Redirect to booking page with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/book?status=success`, 302);

  } catch (error) {
    console.error("Callback route error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
