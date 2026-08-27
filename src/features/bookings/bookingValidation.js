import { z } from 'zod';

export const bookingSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerMobile: z.string().min(10, 'Customer mobile must be at least 10 digits'),
  altNumber: z.string().optional(),
  functionType: z.string().min(1, 'Function type is required'),
  eventDate: z.string().min(1, 'Event date is required'),
  guestCount: z.preprocess(
    (val) => (val === '' ? undefined : Number(val)),
    z.number({ required_error: 'Number of people is required', invalid_type_error: 'Number of people must be a valid number' })
      .min(1, 'Number of people must be at least 1')
  ),
  venueName: z.string().min(1, 'Venue name is required'),
  referenceName: z.string().optional(),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
});
