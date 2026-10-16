import { createTransport } from 'nodemailer';
import { BREVO_SEND_EMAIL_URL } from './mail.constants';
import { BrevoTransport } from './brevo.transport';
import { parseMailbox } from './mailbox.util';

describe('BrevoTransport', () => {
  const fetchMock = jest.fn();
  const transporter = createTransport(new BrevoTransport('test-key'));
  const message = {
    from: 'Booking Tour <no-reply@booking-tour.local>',
    to: 'an@example.com',
    subject: 'Booking #1 approved',
    text: 'Hello',
  };

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });

  it('sends the mail through the Brevo HTTP API', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ messageId: '<abc@brevo>' }), {
        status: 201,
      }),
    );

    const info = await transporter.sendMail(message);

    expect(info).toEqual({ messageId: '<abc@brevo>' });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(BREVO_SEND_EMAIL_URL);
    expect(init.headers).toMatchObject({ 'api-key': 'test-key' });
    expect(JSON.parse(init.body as string)).toEqual({
      sender: { name: 'Booking Tour', email: 'no-reply@booking-tour.local' },
      to: [{ email: 'an@example.com' }],
      subject: 'Booking #1 approved',
      textContent: 'Hello',
    });
  });

  it('rejects with the API status and body so the job is retried and logged', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"message":"Key not found"}', { status: 401 }),
    );

    await expect(transporter.sendMail(message)).rejects.toThrow(
      'Brevo API 401: {"message":"Key not found"}',
    );
  });
});

describe('parseMailbox', () => {
  it.each([
    ['Booking Tour <a@b.com>', { name: 'Booking Tour', email: 'a@b.com' }],
    ['"Booking Tour" <a@b.com>', { name: 'Booking Tour', email: 'a@b.com' }],
    ['<a@b.com>', { email: 'a@b.com' }],
    ['a@b.com', { email: 'a@b.com' }],
  ])('parses %s', (value, expected) => {
    expect(parseMailbox(value)).toEqual(expected);
  });
});
