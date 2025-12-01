interface EmailResult {
  success: boolean;
  message?: string;
}

export const sendZakatReminderEmail = async (toEmail: string, dueDate: string): Promise<EmailResult> => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey || apiKey.includes('__APP_RESEND_API_KEY__')) {
    console.warn('Resend API Key is missing. Email notification skipped.');
    return { success: false, message: 'API Key missing' };
  }

  // NOTE: On the free tier of Resend, you can only send emails to the email address
  // registered to the account. For production, you need to add a domain.
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'ZakatVault <onboarding@resend.dev>',
        to: [toEmail],
        subject: 'ZakatVault: Your Zakat is Due Today',
        html: `
          <div style="font-family: sans-serif; padding: 20px; background-color: #f8fafc; color: #334155;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; border: 1px solid #e2e8f0;">
              <h1 style="color: #059669; margin-top: 0;">Zakat Reminder</h1>
              <p style="font-size: 16px; line-height: 1.5;">
                This is an automated reminder from your <strong>ZakatVault</strong> application.
              </p>
              <p style="font-size: 16px; line-height: 1.5;">
                Today, <strong>${dueDate}</strong>, marks the completion of your Haul (lunar year) for Zakat calculations.
              </p>
              <p style="font-size: 16px; line-height: 1.5;">
                Please log in to the application to check your current net worth, updated market rates, and final Zakat obligation.
              </p>
              <div style="margin-top: 30px; text-align: center;">
                <a href="${window.location.origin}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Open ZakatVault
                </a>
              </div>
            </div>
          </div>
        `
      }),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const errorData = await response.json();
      console.error('Resend API Error:', errorData);
      return { success: false, message: errorData.message || 'Unknown error' };
    }
  } catch (error) {
    console.error('Network error sending email:', error);
    return { success: false, message: 'Network error' };
  }
};