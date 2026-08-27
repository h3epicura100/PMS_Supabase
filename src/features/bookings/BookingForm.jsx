import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { bookingSchema } from './bookingValidation';
import { masterService } from '../masters/masterService';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { todayStr } from '../../utils/dateUtils';
import { User, Calendar, Share2 } from 'lucide-react';

const DEFAULT_FUNCTION_TYPES = ['Wedding', 'Birthday', 'Corporate', 'Engagement', 'Anniversary', 'Other'];
const DEFAULT_EVENT_TIME_OPTIONS = ['Lunch', 'Dinner', 'Breakfast', 'Brunch', 'High Tea', 'Evening Snacks', 'Late Night', 'All Day', 'Custom'];

export function BookingForm({ initialValues, onSubmit, onCancel, isSubmitting }) {
  // Query dynamic master options
  const { data: functionTypes = DEFAULT_FUNCTION_TYPES } = useQuery({
    queryKey: ['master_function_types'],
    queryFn: async () => {
      const res = await masterService.getFunctionTypes();
      return res.map(x => x.name);
    },
  });

  const { data: eventTimeOptions = DEFAULT_EVENT_TIME_OPTIONS } = useQuery({
    queryKey: ['master_event_times'],
    queryFn: async () => {
      const res = await masterService.getEventTimes();
      const names = res.map(x => x.name);
      if (!names.includes('Custom')) names.push('Custom');
      return names;
    },
  });

  const initialEventStart = initialValues?.eventStart || 'Lunch';
  const isPreset = eventTimeOptions.includes(initialEventStart);

  const [selectedTimeOption, setSelectedTimeOption] = useState(
    isPreset ? initialEventStart : 'Custom'
  );
  const [customTimeText, setCustomTimeText] = useState(
    isPreset ? '' : (initialValues?.eventStart || '')
  );
  const [timeError, setTimeError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: initialValues?.customerName || '',
      customerMobile: initialValues?.customerMobile || '',
      altNumber: initialValues?.altNumber || '',
      functionType: initialValues?.functionType || functionTypes[0] || 'Wedding',
      eventDate: initialValues?.eventDate || '',
      guestCount: initialValues?.guestCount || '',
      venueName: initialValues?.venueName || '',
      referenceName: initialValues?.referenceName || '',
      referenceNumber: initialValues?.referenceNumber || '',
      remarks: initialValues?.remarks || '',
    },
  });

  const handleFormSubmit = (data) => {
    if (selectedTimeOption === 'Custom' && !customTimeText.trim()) {
      setTimeError('Custom event time is required.');
      return;
    }

    const finalEventStart = selectedTimeOption === 'Custom'
      ? customTimeText.trim()
      : selectedTimeOption;

    onSubmit({
      ...data,
      eventStart: finalEventStart,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* 1. Meta Block */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Booking ID"
          value={initialValues?.id || 'PMS-2026-AUTO'}
          disabled
          mono
        />
        <Input
          label="Booking Date"
          value={initialValues?.createdAt || todayStr()}
          disabled
        />
      </div>

      {/* 2. Customer Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pms-primary border-b border-slate-100 pb-1.5">
          <User className="w-4 h-4 text-pms-accent" />
          <span>Customer Contact</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Customer Name"
            required
            placeholder="e.g. Rahul Sharma"
            {...register('customerName')}
            error={errors.customerName?.message}
          />

          <Input
            label="Customer Mobile"
            required
            placeholder="9876543210"
            {...register('customerMobile')}
            error={errors.customerMobile?.message}
          />

          <Input
            label="Alternate Number"
            optional
            placeholder="Secondary mobile"
            {...register('altNumber')}
          />
        </div>
      </div>

      {/* 3. Event Parameters Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pms-primary border-b border-slate-100 pb-1.5">
          <Calendar className="w-4 h-4 text-pms-accent" />
          <span>Event Parameters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Select
            label="Function Type"
            required
            options={functionTypes}
            {...register('functionType')}
            error={errors.functionType?.message}
          />

          <Input
            label="Event Date"
            type="date"
            required
            {...register('eventDate')}
            error={errors.eventDate?.message}
          />

          <Select
            label="Event Time"
            required
            value={selectedTimeOption}
            onChange={(e) => {
              setSelectedTimeOption(e.target.value);
              setTimeError('');
            }}
            options={eventTimeOptions}
            error={timeError}
          />

          {selectedTimeOption === 'Custom' && (
            <Input
              label="Custom Event Time"
              required
              placeholder="e.g. 07:30 PM - 10:00 PM"
              value={customTimeText}
              onChange={(e) => {
                setCustomTimeText(e.target.value);
                setTimeError('');
              }}
              error={timeError}
            />
          )}

          <Input
            label="Number of People"
            type="number"
            required
            placeholder="500"
            {...register('guestCount')}
            error={errors.guestCount?.message}
          />

          <Input
            label="Venue Name"
            required
            placeholder="Hotel Grand Regency"
            {...register('venueName')}
            error={errors.venueName?.message}
          />
        </div>
      </div>

      {/* 4. Reference & Notes Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-pms-primary border-b border-slate-100 pb-1.5">
          <Share2 className="w-4 h-4 text-pms-accent" />
          <span>Reference & Remarks</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Reference Name"
            optional
            placeholder="Referrer name"
            {...register('referenceName')}
          />

          <Input
            label="Reference Number"
            optional
            placeholder="Referrer phone"
            {...register('referenceNumber')}
          />

          <div className="sm:col-span-2">
            <Textarea
              label="Remarks"
              optional
              placeholder="Special instructions, venue guidelines, or menu preferences..."
              {...register('remarks')}
            />
          </div>
        </div>
      </div>

      {/* Form Action Footer */}
      <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200 mt-6">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving Booking...' : 'Save Booking'}
        </Button>
      </div>
    </form>
  );
}
