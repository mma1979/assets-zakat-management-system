import React from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { format, parseISO, isValid } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { Calendar as CalendarIcon } from 'lucide-react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  className?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

export const CustomDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  className = "",
  placeholder,
  minDate,
  maxDate,
  disabled
}) => {
  const { dir } = useLanguage();

  const selectedDate = value && isValid(parseISO(value)) ? parseISO(value) : null;

  const handleChange = (date: Date | null) => {
    if (date) {
      onChange(format(date, 'yyyy-MM-dd'));
    } else {
      onChange('');
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none z-10">
        <CalendarIcon size={18} className="text-slate-400" />
      </div>
      <DatePicker
        selected={selectedDate}
        onChange={handleChange}
        dateFormat="dd-MM-yyyy"
        placeholderText={placeholder || "dd-mm-yyyy"}
        className={`w-full p-2.5 ps-10 text-sm text-slate-900 bg-white rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none block ${dir === 'rtl' ? 'text-right' : 'text-left'}`}
        wrapperClassName="w-full"
        minDate={minDate}
        maxDate={maxDate}
        disabled={disabled}
      />
      <style>{`
        .react-datepicker-wrapper {
          width: 100%;
        }
        .react-datepicker__input-container input {
           width: 100%;
        }
        /* Custom Theme Overrides */
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          overflow: hidden;
        }
        .react-datepicker__header {
          background-color: #f0fdf4; /* emerald-50 */
          border-bottom: 1px solid #e2e8f0;
          padding-top: 1rem;
        }
        .react-datepicker__current-month {
          color: #1e293b; /* slate-800 */
          font-weight: 700;
          font-size: 0.95rem;
          margin-bottom: 0.5rem;
        }
        .react-datepicker__day-name {
          color: #64748b; /* slate-500 */
          font-weight: 500;
          width: 2.2rem;
        }
        .react-datepicker__day {
          color: #334155; /* slate-700 */
          width: 2.2rem;
          line-height: 2.2rem;
          margin: 0.1rem;
          border-radius: 0.5rem;
        }
        .react-datepicker__day:hover {
          background-color: #ecfdf5; /* emerald-50 */
          color: #059669; /* emerald-600 */
        }
        .react-datepicker__day--selected, 
        .react-datepicker__day--keyboard-selected {
          background-color: #059669 !important; /* emerald-600 */
          color: white !important;
          font-weight: 600;
        }
        .react-datepicker__day--today {
          font-weight: 700;
          color: #059669;
        }
        .react-datepicker__navigation {
          top: 1rem;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #64748b; /* slate-500 */
        }
      `}</style>
    </div>
  );
};
